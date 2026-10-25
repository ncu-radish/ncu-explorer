import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tables import CampusActivity, CampusLocation, GameSession, SystemConfig
from app.schemas.sim import (
    ScheduleSlot,
    SimNextTurnRequest,
    SimNextTurnResponse,
    SimPrePlanRequest,
    SimPrePlanResponse,
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

    curr_slot = weekly_schedule[0] if weekly_schedule else None
    curr_time = (curr_slot.start_time if curr_slot else None) or "08:00"
    curr_day = (curr_slot.day if curr_slot else 1) or 1

    return SimStartResponse(
        session_id=session_id,
        player_profile=profile.model_dump(),
        weekly_schedule=weekly_schedule,
        current_turn=0,
        current_time=curr_time,
        current_day=curr_day,
        stats=initial_stats,
        current_story=story,
        current_location_id=loc_id,
        current_location_name=loc_name
    )

def add_time_hours(time_str: str, hours: int) -> str:
    try:
        parts = time_str.split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        h = min(23, h + hours)
        return f"{h:02d}:{m:02d}"
    except Exception:
        return time_str

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
            current_time="22:00",
            current_day=5,
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

    next_slot = session.weekly_schedule[session.current_turn]
    curr_time = next_slot.get("start_time") or "08:00"
    curr_day = next_slot.get("day", 1)

    return SimNextTurnResponse(
        session_id=session.session_id,
        current_turn=session.current_turn,
        current_time=curr_time,
        current_day=curr_day,
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
    # Apply effects scaled by duration (1~3 hrs)
    duration = max(1, min(3, req.duration_hours or 1))
    scaled_effects = {}
    for k, v in effects.items():
        scaled_effects[k] = v * duration

    applied_effects = sim_engine.apply_choice_effects(session, {req.option_key: scaled_effects}, req.option_key)

    curr_turn = min(session.current_turn, max(0, len(session.weekly_schedule) - 1))
    curr_slot = session.weekly_schedule[curr_turn] if session.weekly_schedule else {}
    day = curr_slot.get("day", 1)
    updated_schedule = list(session.weekly_schedule or [])

    cat = activity.category
    default_start = "12:00" if cat == "lunch" else ("07:30" if cat == "breakfast" else ("18:00" if cat == "dinner" else "15:00"))
    start_time = curr_slot.get("start_time") or default_start

    # Prevent time overlap: check next scheduled event on the same day
    following_slots = [
        s for s in updated_schedule 
        if s.get("day") == day 
        and (s.get("start_time") or "00:00") > start_time
        and s.get("type") in ("course", "club", "day_end")
    ]
    next_limit_time = min((s.get("start_time") for s in following_slots), default="21:00")
    tentative_end = add_time_hours(start_time, duration)
    end_time = min(tentative_end, next_limit_time) if next_limit_time > start_time else tentative_end

    slot_type = "lunch" if cat == "lunch" else ("dorm" if cat == "dorm_leisure" else ("breakfast" if cat == "breakfast" else ("dinner" if cat == "dinner" else "campus_leisure")))
    loc_id = activity.location_id or ("loc_pine_restaurant" if cat == "lunch" else "loc_dorm_boy9")
    loc_name = activity.location_name or "校園活動地點"

    intent_text = req.custom_title or (chosen_opt.get("intent_hint", activity.title) if chosen_opt else activity.title)

    new_slot = {
        "day": day,
        "slot": f"dynamic_{cat}_{session.current_turn}",
        "title": f"【{activity.title}】{intent_text[:18]} ({duration}小時)",
        "type": slot_type,
        "location_id": loc_id,
        "location_name": loc_name,
        "start_time": start_time,
        "end_time": end_time,
        "display_time": f"{start_time} ~ {end_time}",
        "time_label": f"週{['一','二','三','四','五'][day-1]} {start_time}",
    }

    # If the current slot is a prompt checkpoint (lunch_prompt or leisure_prompt), replace it directly
    if curr_slot.get("type") in ("lunch_prompt", "leisure_prompt"):
        updated_schedule[curr_turn] = new_slot
    else:
        updated_schedule.append(new_slot)

    # Strictly sort the schedule by (day, start_time) to ensure no timeline disorder
    updated_schedule.sort(key=lambda s: (s.get("day", 1), s.get("start_time") or "00:00"))
    session.weekly_schedule = updated_schedule

    # Locate new_slot's new index in sorted schedule
    try:
        new_turn_idx = updated_schedule.index(new_slot)
    except ValueError:
        new_turn_idx = curr_turn

    # Update history log
    log_entry = f"進行了【{activity.title}】({duration}小時)：{intent_text}"
    session.history_logs = (session.history_logs or []) + [log_entry]

    if loc_id and loc_id not in (session.visited_locs or []):
        session.visited_locs = (session.visited_locs or []) + [loc_id]

    # Directly advance to next turn to avoid requiring the user to choose again
    next_turn_idx = new_turn_idx + 1
    total_slots = len(updated_schedule)
    is_game_over = False
    next_story = None
    next_time = end_time
    next_day = day

    if next_turn_idx >= total_slots:
        session.current_turn = total_slots
        is_game_over = True
    else:
        session.current_turn = next_turn_idx
        active_model, trigger_prob = get_system_config(db)
        next_story, _, next_loc_id, next_loc_name = await sim_engine.generate_turn_content(
            db, session, active_model, trigger_prob
        )
        if next_loc_id and next_loc_id not in (session.visited_locs or []):
            session.visited_locs = (session.visited_locs or []) + [next_loc_id]
        next_slot = updated_schedule[session.current_turn]
        next_time = next_slot.get("start_time") or "08:00"
        next_day = next_slot.get("day", 1)
        loc_id = next_loc_id or loc_id
        loc_name = next_loc_name or loc_name

    db.commit()

    return SimTriggerActivityResponse(
        session_id=session.session_id,
        message=f"已成功進行並在行事曆上標記「{activity.title}」！",
        marked_slot=ScheduleSlot(**new_slot),
        weekly_schedule=[ScheduleSlot(**s) for s in updated_schedule],
        current_turn=session.current_turn,
        current_time=next_time,
        current_day=next_day,
        stats=session.stats,
        delta_stats=applied_effects,
        story=next_story,
        is_game_over=is_game_over,
        current_location_id=loc_id,
        current_location_name=loc_name
    )

@router.post("/pre-plan-tomorrow", response_model=SimPrePlanResponse)
async def pre_plan_tomorrow(req: SimPrePlanRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="找不到指定的遊戲工作階段")

    active_model, trigger_prob = get_system_config(db)
    updated_schedule = list(session.weekly_schedule or [])

    # Insert pre-planned slots for target_day
    for slot_data in req.slots:
        st = slot_data.get("start_time", "08:00")
        dur = int(slot_data.get("duration_hours", 1))
        et = slot_data.get("end_time") or add_time_hours(st, dur)
        new_slot = {
            "day": req.target_day,
            "slot": f"preplan_{req.target_day}_{st}",
            "title": slot_data.get("title", "預排活動"),
            "type": slot_data.get("type", "campus_leisure"),
            "location_id": slot_data.get("location_id", "loc_pine_restaurant"),
            "location_name": slot_data.get("location_name", "校園設施"),
            "start_time": st,
            "end_time": et,
            "display_time": f"{st} ~ {et}",
            "time_label": f"週{['一','二','三','四','五'][req.target_day-1]} {st}",
        }
        updated_schedule.append(new_slot)

    # Strictly sort entire schedule by (day, start_time)
    updated_schedule.sort(key=lambda s: (s.get("day", 1), s.get("start_time") or "00:00"))
    session.weekly_schedule = updated_schedule

    # Find the target day's first event index to start tomorrow
    target_idx = session.current_turn + 1
    for idx, s in enumerate(updated_schedule):
        if s.get("day") == req.target_day:
            target_idx = idx
            break

    session.current_turn = min(target_idx, max(0, len(updated_schedule) - 1))

    # Generate next turn story for tomorrow morning
    story, _, loc_id, loc_name = await sim_engine.generate_turn_content(
        db, session, active_model, trigger_prob
    )
    if loc_id and loc_id not in (session.visited_locs or []):
        session.visited_locs = (session.visited_locs or []) + [loc_id]

    db.commit()

    return SimPrePlanResponse(
        session_id=session.session_id,
        message=f"已成功為週{['一','二','三','四','五'][req.target_day-1]}預排行程並展開新的一天！",
        current_turn=session.current_turn,
        weekly_schedule=[ScheduleSlot(**s) for s in updated_schedule],
        stats=session.stats,
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
