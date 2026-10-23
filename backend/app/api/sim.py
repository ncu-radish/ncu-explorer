import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tables import CampusLocation, Course, GameSession, SystemConfig
from app.schemas.sim import (
    SimNextTurnRequest,
    SimNextTurnResponse,
    SimStartRequest,
    SimStartResponse,
    SimSummaryRequest,
    SimSummaryResponse,
)
from app.services.sim_engine import sim_engine

router = APIRouter(prefix="/sim", tags=["Simulation"])

def get_system_config(db: Session):
    config = db.query(SystemConfig).first()
    if not config:
        return "gemma3:4b", 0.35
    return config.active_llm_model, config.event_trigger_prob

@router.post("/start", response_model=SimStartResponse)
async def start_simulation(req: SimStartRequest, db: Session = Depends(get_db)):
    active_model, trigger_prob = get_system_config(db)

    # 1. 解析玩家志向意圖
    profile = await sim_engine.parse_onboarding(req.user_input, active_model)

    # 2. 排定 21 時段課表
    weekly_schedule = sim_engine.build_weekly_schedule(db, profile)

    # 3. 建立 Session
    session_id = str(uuid.uuid4())
    initial_stats = {"stamina": 80, "study": 50, "social": 50, "money": 1500}

    new_session = GameSession(
        session_id=session_id,
        player_profile=profile.model_dump(),
        weekly_schedule=[s.model_dump() for s in weekly_schedule],
        current_turn=0,
        stats=initial_stats,
        visited_locs=[],
        triggered_evts=[],
        history_logs=[]
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # 4. 生成第 0 回合情境故事
    story, effects_map, loc_id, loc_name = await sim_engine.generate_turn_content(
        db, new_session, active_model, trigger_prob
    )

    if loc_id and loc_id not in new_session.visited_locs:
        new_session.visited_locs = (new_session.visited_locs or []) + [loc_id]
        db.commit()

    # 暫存本回合 options effects 至 session 或由前端依 key 傳送
    return SimStartResponse(
        session_id=session_id,
        player_profile=profile.model_dump(),
        weekly_schedule=weekly_schedule,
        current_turn=0,
        stats=initial_stats,
        current_story=story,
        current_location_id=loc_id,
        current_location_name=loc_name
    )

@router.post("/next-turn", response_model=SimNextTurnResponse)
async def next_turn(req: SimNextTurnRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="找不到指定的遊戲工作階段")

    active_model, trigger_prob = get_system_config(db)

    # 1. 結算上一回合數值增減 (根據 option A/B/C)
    effects_default = {
        "A": {"stamina": -10, "study": 12, "social": 5, "money": 0},
        "B": {"stamina": 10, "study": 0, "social": 0, "money": 0},
        "C": {"stamina": -5, "study": 0, "social": 12, "money": -60}
    }
    applied_effects = sim_engine.apply_choice_effects(session, effects_default, req.option_key)

    # 紀錄行動日誌
    current_slot = session.weekly_schedule[session.current_turn]
    log_entry = f"{current_slot.get('title', '行程')}：選擇了方案 {req.option_key}"
    session.history_logs = (session.history_logs or []) + [log_entry]

    # 2. 推進至下一回合
    session.current_turn += 1

    # 3. 檢查是否達一週終點 (21回合)
    if session.current_turn >= 21:
        db.commit()
        return SimNextTurnResponse(
            session_id=session.session_id,
            current_turn=session.current_turn,
            is_game_over=True,
            stats=session.stats,
            delta_stats=applied_effects,
            story=None
        )

    # 4. 生成下一回合故事與選項
    story, _, loc_id, loc_name = await sim_engine.generate_turn_content(
        db, session, active_model, trigger_prob
    )

    if loc_id and loc_id not in (session.visited_locs or []):
        session.visited_locs = (session.visited_locs or []) + [loc_id]

    db.commit()

    return SimNextTurnResponse(
        session_id=session.session_id,
        current_turn=session.current_turn,
        is_game_over=False,
        stats=session.stats,
        delta_stats=applied_effects,
        story=story,
        current_location_id=loc_id,
        current_location_name=loc_name
    )

@router.post("/summary", response_model=SimSummaryResponse)
async def get_summary(req: SimSummaryRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="找不到指定的遊戲工作階段")

    active_model, _ = get_system_config(db)
    title, diary = await sim_engine.generate_week_summary(db, session, active_model)

    # 造訪過的館舍卡片資料
    visited_loc_objs = db.query(CampusLocation).filter(CampusLocation.id.in_(session.visited_locs or [])).all()
    visited_data = [
        {"id": loc.id, "name": loc.name, "category": loc.category, "short_desc": loc.short_desc}
        for loc in visited_loc_objs
    ]

    # 修課清單
    enrolled_ids = [
        s.get("course_id") for s in session.weekly_schedule if s.get("type") == "course" and s.get("course_id")
    ]
    enrolled_courses = db.query(Course).filter(Course.id.in_(enrolled_ids)).all()
    courses_data = [
        {"id": c.id, "name": c.course_name, "department": c.department, "credits": c.credits}
        for c in enrolled_courses
    ]

    return SimSummaryResponse(
        session_id=session.session_id,
        title=title,
        summary_diary=diary,
        final_stats=session.stats,
        visited_locations=visited_data,
        enrolled_courses=courses_data
    )
