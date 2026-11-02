import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.database import get_db
from app.models.tables import CampusActivity, CampusLocation, GameSession, RandomEvent, SystemConfig
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

def sync_active_event(session: GameSession, story: Any, effects_map: dict[str, Any], db: Session | None = None):
    profile = dict(session.player_profile or {})
    if getattr(story, "is_random_event", False) and getattr(story, "event_id", None):
        options_meta = {}
        raw_options = {}
        if db:
            ev = db.query(RandomEvent).filter(RandomEvent.id == story.event_id).first()
            if ev and isinstance(ev.preset_options, list):
                raw_options = {o.get("option_key"): o for o in ev.preset_options if isinstance(o, dict)}
        for opt in (getattr(story, "options", []) or []):
            raw = raw_options.get(opt.option_key, {})
            eff = raw.get("effects") or effects_map.get(opt.option_key, {})
            options_meta[opt.option_key] = {
                "option_key": opt.option_key,
                "intent_hint": opt.display_text or raw.get("intent_hint", ""),
                "effects": eff,
                "time_action": raw.get("time_action", "none"),
                "target_time": raw.get("target_time"),
                "duration_hours": float(raw.get("duration_hours") or 0.0),
            }
        profile["active_random_event"] = {
            "id": story.event_id,
            "title": story.event_title or "突發狀況",
            "turn": session.current_turn,
            "effects_map": effects_map,
            "options_meta": options_meta
        }
    else:
        profile.pop("active_random_event", None)
    session.player_profile = profile
    flag_modified(session, "player_profile")

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
    sync_active_event(new_session, story, effects_map, db=db)

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

def add_time_minutes(time_str: str, minutes: int) -> str:
    try:
        parts = time_str.split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        total_mins = h * 60 + m + minutes
        new_total_mins = total_mins % (24 * 60)
        new_h = new_total_mins // 60
        new_m = new_total_mins % 60
        return f"{new_h:02d}:{new_m:02d}"
    except Exception:
        return time_str

def add_time_hours(time_str: str, hours: float) -> str:
    mins = int(round(hours * 60))
    return add_time_minutes(time_str, mins)

def time_to_night_mins(time_str: str) -> int:
    try:
        parts = time_str.split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        if h < 5:
            h += 24
        return h * 60 + m
    except Exception:
        return 0

def schedule_sort_key(s: dict) -> tuple[int, int]:
    d = s.get("day", 1)
    st = s.get("start_time") or "08:00"
    try:
        parts = st.split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        if h <= 5 and s.get("type") in ("day_end", "dorm", "campus_leisure"):
            h += 24
        return (d, h * 60 + m)
    except Exception:
        return (d, 0)

@router.post("/next-turn", response_model=SimNextTurnResponse)
async def next_turn(req: SimNextTurnRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="找不到指定的遊戲工作階段")

    active_model, trigger_prob = get_system_config(db)

    profile = dict(session.player_profile or {})
    active_event = profile.get("active_random_event")

    # 檢查此回合是否是在處理突發事件
    is_resolving_event = bool(active_event and active_event.get("turn") == session.current_turn)
    slot_new_time = None

    if is_resolving_event:
        # 1. 取得突發事件專屬效果
        effects_map = active_event.get("effects_map", {})
        effects_for_choice = effects_map.get(req.option_key) or {
            "stamina": -10, "study": 10, "social": 0, "money": 0
        }
        applied_effects = sim_engine.apply_choice_effects(
            session, {req.option_key: effects_for_choice}, req.option_key
        )

        ev_title = active_event.get("title", "突發狀況")
        current_slot = session.weekly_schedule[session.current_turn]
        slot_title = current_slot.get("title", "排定行程")

        options_meta = active_event.get("options_meta", {})
        opt_info = options_meta.get(req.option_key, {})
        opt_hint = opt_info.get("intent_hint", f"方案 {req.option_key}")
        time_action = opt_info.get("time_action")
        target_time = opt_info.get("target_time")
        duration_hours = float(opt_info.get("duration_hours") or 0.0)

        # 突發事件已決策完畢，清除作用中的事件
        profile.pop("active_random_event", None)
        session.player_profile = profile
        flag_modified(session, "player_profile")

        day = current_slot.get("day", 1)
        cur_st = current_slot.get("start_time") or "08:00"
        cur_et = current_slot.get("end_time") or "09:00"

        # 依後台設定之結束時間與跳轉模式進行時間與時段推進
        if time_action == "jump_to_time" and target_time:
            # 模式一：直接跳到指定時間 (例如 12:00)
            target_idx = None
            for idx, s in enumerate(session.weekly_schedule):
                if s.get("day") == day and (s.get("start_time") or "00:00") >= target_time:
                    target_idx = idx
                    break
            if target_idx is None:
                for idx, s in enumerate(session.weekly_schedule):
                    if s.get("day", 1) > day:
                        target_idx = idx
                        break
            new_target_idx = target_idx if target_idx is not None else len(session.weekly_schedule)

            # 將被跳過的排定時段標註為已跳過
            updated_schedule = [dict(s) for s in (session.weekly_schedule or [])]
            for i in range(session.current_turn, new_target_idx):
                if i < len(updated_schedule):
                    updated_schedule[i]["is_skipped"] = True
                    updated_schedule[i]["skip_reason"] = f"因突發狀況【{ev_title}】跳過"
            session.weekly_schedule = updated_schedule
            flag_modified(session, "weekly_schedule")

            session.current_turn = new_target_idx
            log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（跳轉至 {target_time}）"
            session.history_logs = (session.history_logs or []) + [log_entry]

            if session.current_turn >= len(session.weekly_schedule):
                db.commit()
                return SimNextTurnResponse(
                    session_id=session.session_id,
                    current_turn=session.current_turn,
                    current_time="22:00",
                    current_day=5,
                    is_game_over=True,
                    stats=session.stats,
                    delta_stats=applied_effects,
                    story=None,
                    weekly_schedule=[ScheduleSlot(**s) for s in (session.weekly_schedule or [])]
                )

            story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                db, session, active_model, trigger_prob, allow_random_event=True
            )
            sync_active_event(session, story, next_effects, db=db)

        elif time_action == "add_hours" and duration_hours > 0:
            # 模式二：跳到 N 小時後 (例如慢慢梳洗代簽到，跳到 1 小時後)
            new_time = add_time_hours(cur_st, duration_hours)
            if new_time < cur_et:
                slot_new_time = new_time
                log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（耗時 {duration_hours} 小時，於 {new_time} 進入「{slot_title}」）"
                session.history_logs = (session.history_logs or []) + [log_entry]

                story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                    db, session, active_model, trigger_prob, allow_random_event=False
                )
                sync_active_event(session, story, next_effects, db=db)
            else:
                target_idx = None
                for idx, s in enumerate(session.weekly_schedule):
                    if s.get("day") == day and (s.get("start_time") or "00:00") >= new_time:
                        target_idx = idx
                        break
                if target_idx is None:
                    for idx, s in enumerate(session.weekly_schedule):
                        if s.get("day", 1) > day:
                            target_idx = idx
                            break
                new_target_idx = target_idx if target_idx is not None else len(session.weekly_schedule)

                # 將超時跳過的時段標註為已跳過
                updated_schedule = [dict(s) for s in (session.weekly_schedule or [])]
                for i in range(session.current_turn, new_target_idx):
                    if i < len(updated_schedule):
                        updated_schedule[i]["is_skipped"] = True
                        updated_schedule[i]["skip_reason"] = f"因突發狀況【{ev_title}】超時未參與"
                session.weekly_schedule = updated_schedule
                flag_modified(session, "weekly_schedule")

                session.current_turn = new_target_idx
                log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（耗時 {duration_hours} 小時，跳至下一行程）"
                session.history_logs = (session.history_logs or []) + [log_entry]

                if session.current_turn >= len(session.weekly_schedule):
                    db.commit()
                    return SimNextTurnResponse(
                        session_id=session.session_id,
                        current_turn=session.current_turn,
                        current_time="22:00",
                        current_day=5,
                        is_game_over=True,
                        stats=session.stats,
                        delta_stats=applied_effects,
                        story=None,
                        weekly_schedule=[ScheduleSlot(**s) for s in (session.weekly_schedule or [])]
                    )

                story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                    db, session, active_model, trigger_prob, allow_random_event=True
                )
                sync_active_event(session, story, next_effects, db=db)

        elif time_action == "next_slot":
            # 模式三：跳過當前行程，進入下一時段
            updated_schedule = [dict(s) for s in (session.weekly_schedule or [])]
            if session.current_turn < len(updated_schedule):
                updated_schedule[session.current_turn]["is_skipped"] = True
                updated_schedule[session.current_turn]["skip_reason"] = f"因突發狀況【{ev_title}】跳過"
            session.weekly_schedule = updated_schedule
            flag_modified(session, "weekly_schedule")

            session.current_turn += 1
            log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（跳過排定行程「{slot_title}」）"
            session.history_logs = (session.history_logs or []) + [log_entry]

            if session.current_turn >= len(session.weekly_schedule):
                db.commit()
                return SimNextTurnResponse(
                    session_id=session.session_id,
                    current_turn=session.current_turn,
                    current_time="22:00",
                    current_day=5,
                    is_game_over=True,
                    stats=session.stats,
                    delta_stats=applied_effects,
                    story=None,
                    weekly_schedule=[ScheduleSlot(**s) for s in (session.weekly_schedule or [])]
                )

            story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                db, session, active_model, trigger_prob, allow_random_event=True
            )
            sync_active_event(session, story, next_effects, db=db)

        elif time_action == "none":
            # 模式四：不耗時間，立即進入當前排定行程
            log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（立即趕赴「{slot_title}」）"
            session.history_logs = (session.history_logs or []) + [log_entry]

            story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                db, session, active_model, trigger_prob, allow_random_event=False
            )
            sync_active_event(session, story, next_effects, db=db)

        else:
            # 模式五：備援關鍵字判斷
            skip_keywords = (
                "繼續睡", "回去睡", "再睡", "自主放假", "放假",
                "蹺課", "翹課", "放棄前進", "不去", "取消",
                "不出門", "縮回被窩", "拉過頭頂", "睡過頭放棄"
            )
            attend_keywords = ("衝", "上課", "教室", "抵達", "趕往", "出門", "簽到", "點名", "參加")

            has_skip = any(k in opt_hint for k in skip_keywords)
            has_attend = any(k in opt_hint for k in attend_keywords)

            if has_skip and not has_attend:
                updated_schedule = [dict(s) for s in (session.weekly_schedule or [])]
                if session.current_turn < len(updated_schedule):
                    updated_schedule[session.current_turn]["is_skipped"] = True
                    updated_schedule[session.current_turn]["skip_reason"] = f"因突發狀況【{ev_title}】跳過"
                session.weekly_schedule = updated_schedule
                flag_modified(session, "weekly_schedule")

                session.current_turn += 1
                log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（放棄或跳過「{slot_title}」）"
                session.history_logs = (session.history_logs or []) + [log_entry]

                if session.current_turn >= len(session.weekly_schedule):
                    db.commit()
                    return SimNextTurnResponse(
                        session_id=session.session_id,
                        current_turn=session.current_turn,
                        current_time="22:00",
                        current_day=5,
                        is_game_over=True,
                        stats=session.stats,
                        delta_stats=applied_effects,
                        story=None,
                        weekly_schedule=[ScheduleSlot(**s) for s in (session.weekly_schedule or [])]
                    )

                story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                    db, session, active_model, trigger_prob, allow_random_event=True
                )
                sync_active_event(session, story, next_effects, db=db)
            else:
                log_entry = f"【突發狀況：{ev_title}】：選擇了方案 {req.option_key}（成功趕赴「{slot_title}」）"
                session.history_logs = (session.history_logs or []) + [log_entry]

                story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
                    db, session, active_model, trigger_prob, allow_random_event=False
                )
                sync_active_event(session, story, next_effects, db=db)

    else:
        # 常規行程推進
        effects_default = {
            "A": {"stamina": -10, "study": 12, "social": 5, "money": 0},
            "B": {"stamina": 10, "study": 0, "social": 0, "money": 0},
            "C": {"stamina": -5, "study": 0, "social": 12, "money": -60}
        }
        applied_effects = sim_engine.apply_choice_effects(session, effects_default, req.option_key)

        current_slot = session.weekly_schedule[session.current_turn]
        log_entry = f"{current_slot.get('title', '行程')}：選擇了方案 {req.option_key}"
        session.history_logs = (session.history_logs or []) + [log_entry]

        session.current_turn += 1

        if session.current_turn >= len(session.weekly_schedule):
            db.commit()
            return SimNextTurnResponse(
                session_id=session.session_id,
                current_turn=session.current_turn,
                current_time="22:00",
                current_day=5,
                is_game_over=True,
                stats=session.stats,
                delta_stats=applied_effects,
                story=None,
                weekly_schedule=[ScheduleSlot(**s) for s in (session.weekly_schedule or [])]
            )

        story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
            db, session, active_model, trigger_prob, allow_random_event=True
        )
        sync_active_event(session, story, next_effects, db=db)

    if loc_id and loc_id not in (session.visited_locs or []):
        session.visited_locs = (session.visited_locs or []) + [loc_id]

    db.commit()

    next_slot = session.weekly_schedule[session.current_turn]
    curr_time = slot_new_time or next_slot.get("start_time") or "08:00"
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

    curr_turn = min(session.current_turn, max(0, len(session.weekly_schedule) - 1))
    curr_slot = session.weekly_schedule[curr_turn] if session.weekly_schedule else {}
    day = curr_slot.get("day", 1)
    updated_schedule = list(session.weekly_schedule or [])

    cat = activity.category
    default_start = "12:00" if cat == "lunch" else ("07:30" if cat == "breakfast" else ("18:00" if cat == "dinner" else "15:00"))
    start_time = curr_slot.get("start_time") or default_start

    # 解析使用者自訂時長 (支援分鐘、自訂結束時間、或浮點數小時)
    if req.custom_end_time:
        try:
            sh, sm = map(int, start_time.split(":"))
            eh, em = map(int, req.custom_end_time.split(":"))
            s_mins = (sh < 5 and (curr_slot.get("type") == "day_end" or start_time < "05:00")) and (sh + 24) * 60 + sm or (sh * 60 + sm)
            e_mins = (eh < 5) and (eh + 24) * 60 + em or (eh * 60 + em)
            diff_m = max(15, e_mins - s_mins)
            duration_minutes = diff_m
            duration = round(duration_minutes / 60.0, 2)
        except Exception:
            duration = float(req.duration_hours or 1.0)
            duration_minutes = int(round(duration * 60))
    elif req.duration_minutes is not None and req.duration_minutes > 0:
        duration_minutes = req.duration_minutes
        duration = round(duration_minutes / 60.0, 2)
    else:
        duration = float(req.duration_hours or 1.0)
        duration_minutes = int(round(duration * 60))

    duration = max(0.25, min(8.0, duration))
    duration_minutes = max(15, min(480, duration_minutes))

    # Apply effects scaled by duration
    scaled_effects = {}
    for k, v in effects.items():
        scaled_effects[k] = int(round(v * duration))

    applied_effects = sim_engine.apply_choice_effects(session, {req.option_key: scaled_effects}, req.option_key)

    # 計算活動結束時間 (若在 21:00 之後或深夜，以清晨 05:00 為換日線上限)
    is_late_night = (curr_slot.get("type") == "day_end") or (start_time >= "21:00" or start_time < "05:00")
    if is_late_night:
        cur_mins = time_to_night_mins(start_time)
        target_mins = cur_mins + duration_minutes
        max_night_mins = 29 * 60  # 清晨 05:00 換日線
        actual_mins = min(target_mins, max_night_mins)
        actual_h = (actual_mins // 60) % 24
        actual_m = actual_mins % 60
        end_time = f"{actual_h:02d}:{actual_m:02d}"
    else:
        following_slots = [
            s for s in updated_schedule
            if s.get("day") == day
            and (s.get("start_time") or "00:00") > start_time
            and s.get("type") in ("course", "club", "day_end")
        ]
        next_limit_time = min((s.get("start_time") for s in following_slots), default="21:00")
        tentative_end = add_time_minutes(start_time, duration_minutes)
        end_time = min(tentative_end, next_limit_time) if next_limit_time > start_time else tentative_end

    slot_type = "lunch" if cat == "lunch" else ("dorm" if cat == "dorm_leisure" else ("breakfast" if cat == "breakfast" else ("dinner" if cat == "dinner" else "campus_leisure")))
    loc_id = activity.location_id or ("loc_pine_restaurant" if cat == "lunch" else "loc_dorm_boy9")
    loc_name = activity.location_name or "校園活動地點"

    intent_text = req.custom_title or (chosen_opt.get("intent_hint", activity.title) if chosen_opt else activity.title)
    dur_label = f"{int(duration)}小時" if duration == int(duration) else (f"{duration}小時" if duration >= 1 else f"{duration_minutes}分鐘")

    new_slot = {
        "day": day,
        "slot": f"dynamic_{cat}_{session.current_turn}",
        "title": f"【{activity.title}】{intent_text[:18]} ({dur_label})",
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
    elif curr_slot.get("type") == "day_end" or is_late_night:
        # 晚間活動：插入新活動 slot，並將 day_end 順延至此活動的 end_time (直到 05:00 換日線)
        updated_schedule.append(new_slot)
        day_end_slot = next((s for s in updated_schedule if s.get("day") == day and s.get("type") == "day_end"), None)
        if day_end_slot:
            day_end_slot["start_time"] = end_time
            day_end_slot["end_time"] = add_time_hours(end_time, 1)
            day_end_slot["slot"] = end_time
            day_end_slot["display_time"] = end_time
            day_end_slot["time_label"] = f"週{['一','二','三','四','五'][day-1]} {end_time}"
        else:
            updated_schedule.append({
                "day": day,
                "slot": end_time,
                "title": f"週{['一','二','三','四','五'][day-1]} {end_time} 夜幕低垂 · 晚間作息與明日規劃",
                "type": "day_end",
                "location_id": "loc_dorm_boy9",
                "location_name": "學生宿舍",
                "start_time": end_time,
                "end_time": add_time_hours(end_time, 1),
                "display_time": end_time,
                "time_label": f"週{['一','二','三','四','五'][day-1]} {end_time}",
            })
    else:
        updated_schedule.append(new_slot)

    # Strictly sort the schedule by schedule_sort_key to ensure no timeline disorder
    updated_schedule.sort(key=schedule_sort_key)
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
        next_story, next_effects, next_loc_id, next_loc_name = await sim_engine.generate_turn_content(
            db, session, active_model, trigger_prob
        )
        sync_active_event(session, next_story, next_effects, db=db)
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

def calc_sleep_duration(sleep_t: str, alarm_t: str) -> float:
    try:
        sh, sm = map(int, sleep_t.split(":"))
        ah, am = map(int, alarm_t.split(":"))
        sleep_mins = sh * 60 + sm
        alarm_mins = ah * 60 + am
        if alarm_mins <= sleep_mins:
            total_mins = (24 * 60 - sleep_mins) + alarm_mins
        else:
            total_mins = alarm_mins - sleep_mins
        return max(1.0, round(total_mins / 60.0, 1))
    except Exception:
        return 8.0

@router.post("/pre-plan-tomorrow", response_model=SimPrePlanResponse)
async def pre_plan_tomorrow(req: SimPrePlanRequest, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.session_id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="找不到指定的遊戲工作階段")

    active_model, trigger_prob = get_system_config(db)
    updated_schedule = list(session.weekly_schedule or [])

    # 1. Calculate sleep duration and restore stamina
    sleep_t = req.sleep_time or "22:00"
    alarm_t = req.alarm_time or "07:30"
    sleep_hours = calc_sleep_duration(sleep_t, alarm_t)

    if 7.0 <= sleep_hours <= 9.5:
        stamina_gain = int(sleep_hours * 5)  # optimal sleep +35~+45
    elif sleep_hours < 6.0:
        stamina_gain = max(10, int(sleep_hours * 3))  # sleep deprivation
    else:
        stamina_gain = 30

    curr_stats = dict(session.stats or {})
    curr_stats["stamina"] = min(100, curr_stats.get("stamina", 80) + stamina_gain)
    session.stats = curr_stats

    # Log sleep and alarm
    session.history_logs = (session.history_logs or []) + [
        f"於 {sleep_t} 就寢，鬧鐘設定於 {alarm_t}，共睡眠 {sleep_hours} 小時 (體力 +{stamina_gain})"
    ]

    # 2. Add wakeup alarm slot at alarm_t if no event exists before 08:30
    has_early_slot = any(
        s.get("day") == req.target_day and (s.get("start_time") or "00:00") <= alarm_t
        for s in req.slots
    )
    if not has_early_slot:
        updated_schedule.append({
            "day": req.target_day,
            "slot": f"alarm_{req.target_day}_{alarm_t}",
            "title": f"⏰ 鬧鐘響起 · 晨起梳洗 ({alarm_t})",
            "type": "dorm",
            "location_id": "loc_dorm_boy9",
            "location_name": "學生宿舍",
            "start_time": alarm_t,
            "end_time": add_time_minutes(alarm_t, 30),
            "display_time": f"{alarm_t} ~ {add_time_minutes(alarm_t, 30)}",
            "time_label": f"週{['一','二','三','四','五'][req.target_day-1]} {alarm_t}",
        })

    # 3. Insert pre-planned slots for target_day
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
    next_slot = updated_schedule[session.current_turn]
    curr_time = next_slot.get("start_time") or alarm_t
    curr_day = next_slot.get("day", req.target_day)

    # Generate next turn story for tomorrow morning
    story, next_effects, loc_id, loc_name = await sim_engine.generate_turn_content(
        db, session, active_model, trigger_prob
    )
    sync_active_event(session, story, next_effects, db=db)
    if loc_id and loc_id not in (session.visited_locs or []):
        session.visited_locs = (session.visited_locs or []) + [loc_id]

    db.commit()

    day_zh = ['一','二','三','四','五'][req.target_day-1]
    return SimPrePlanResponse(
        session_id=session.session_id,
        message=f"已設定鬧鐘於 {alarm_t}，昨晚睡眠 {sleep_hours} 小時 (體力 +{stamina_gain})，早安週{day_zh}！",
        current_turn=session.current_turn,
        current_time=curr_time,
        current_day=curr_day,
        weekly_schedule=[ScheduleSlot(**s) for s in updated_schedule],
        stats=session.stats,
        delta_stats={"stamina": stamina_gain},
        sleep_hours=sleep_hours,
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
