import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tables import CampusActivity, CampusLocation, GameSession, SystemConfig
from app.schemas.sim import (
    ScheduleSlot,
    SimNextTurnRequest,
    SimNextTurnResponse,
    SimStartRequest,
    SimStartResponse,
    SimSummaryRequest,
    SimSummaryResponse,
    SimTriggerActivityRequest,
    SimTriggerActivityResponse,
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

    # 1. 解析玩家志向意圖 (支援直接傳入學系與年級)
    profile = await sim_engine.parse_onboarding(
        req.user_input,
        active_model,
        dept_hint=req.department,
        grade_hint=req.grade
    )

    # 2. 排定週一至週五完整時間軸課表
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

    # 3. 檢查是否達一週終點
    total_turns = len(session.weekly_schedule)
    if session.current_turn >= total_turns:
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
        current_location_name=loc_name,
        weekly_schedule=[ScheduleSlot(**s) for s in (session.weekly_schedule or [])]
    )

@router.post("/trigger-activity", response_model=SimTriggerActivityResponse)
async def trigger_activity(req: SimTriggerActivityRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="找不到指定的遊戲工作階段")

    activity = db.query(CampusActivity).filter(CampusActivity.id == req.activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="找不到指定的校園活動")

    # Find the matching option
    chosen_opt = None
    for opt in (activity.preset_options or []):
        if opt.get("option_key") == req.option_key:
            chosen_opt = opt
            break
    if not chosen_opt and activity.preset_options:
        chosen_opt = activity.preset_options[0]

    effects = chosen_opt.get("effects", {}) if chosen_opt else {}
    applied_effects = sim_engine.apply_choice_effects(session, {req.option_key: effects}, req.option_key)

    # Calculate day and time for dynamic slot
    curr_turn = min(session.current_turn, max(0, len(session.weekly_schedule) - 1))
    curr_slot = session.weekly_schedule[curr_turn] if session.weekly_schedule else {}
    day = curr_slot.get("day", 1)

    # Determine time range and slot type
    cat = activity.category
    if cat == "breakfast":
        start_time, end_time = "07:30", "08:30"
        slot_type = "breakfast"
    elif cat == "lunch":
        start_time, end_time = "12:00", "13:00"
        slot_type = "lunch"
    elif cat == "dinner":
        start_time, end_time = "18:00", "19:00"
        slot_type = "dinner"
    elif cat == "dorm_leisure":
        start_time, end_time = "15:30", "16:30"
        slot_type = "dorm"
    else:  # campus_leisure
        start_time, end_time = "16:30", "17:30"
        slot_type = "campus_leisure"

    loc_id = activity.location_id or "loc_pine_restaurant"
    loc_name = activity.location_name or "校園活動地點"

    intent_text = chosen_opt.get("intent_hint", activity.title) if chosen_opt else activity.title

    new_slot = {
        "day": day,
        "slot": f"dynamic_{cat}_{session.current_turn}",
        "title": f"【{activity.title}】{intent_text[:16]}",
        "type": slot_type,
        "location_id": loc_id,
        "location_name": loc_name,
        "start_time": start_time,
        "end_time": end_time,
        "display_time": f"{start_time} ~ {end_time}",
        "time_label": f"週{['一','二','三','四','五'][day-1]} {start_time}~{end_time}",
    }

    # Dynamically mark into weekly_schedule
    updated_schedule = list(session.weekly_schedule or [])
    insert_idx = min(curr_turn + 1, len(updated_schedule))
    updated_schedule.insert(insert_idx, new_slot)
    session.weekly_schedule = updated_schedule

    # Update history log
    log_entry = f"進行了【{activity.title}】：{intent_text}"
    session.history_logs = (session.history_logs or []) + [log_entry]

    if loc_id and loc_id not in (session.visited_locs or []):
        session.visited_locs = (session.visited_locs or []) + [loc_id]

    db.commit()

    return SimTriggerActivityResponse(
        session_id=session.session_id,
        message=f"已成功進行並在行事曆上標記「{activity.title}」！",
        marked_slot=ScheduleSlot(**new_slot),
        weekly_schedule=[ScheduleSlot(**s) for s in updated_schedule],
        stats=session.stats,
        delta_stats=applied_effects,
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

    # 修課清單從實際排定的 weekly_schedule 中統計
    seen_c = set()
    courses_data = []
    total_cr = 0.0
    for s in (session.weekly_schedule or []):
        if s.get("type") == "course" and s.get("title"):
            cid = s.get("course_id") or s.get("title")
            if cid not in seen_c:
                seen_c.add(cid)
                cr = float(s.get("credits") or 0.0)
                total_cr += cr
                courses_data.append({
                    "id": cid,
                    "name": s.get("title"),
                    "credits": cr,
                    "category": s.get("course_category", "必修"),
                    "instructor": s.get("instructor", ""),
                    "raw_schedule": s.get("raw_schedule", ""),
                    "location": s.get("location_name", "")
                })

    return SimSummaryResponse(
        session_id=session.session_id,
        title=title,
        summary_diary=diary,
        final_stats=session.stats,
        visited_locations=visited_data,
        enrolled_courses=courses_data,
        total_credits=total_cr
    )
