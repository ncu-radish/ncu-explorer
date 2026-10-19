from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tables import (
    AdminUser,
    SystemConfig,
    RandomEvent,
    CampusLocation,
    Course,
    GameSession,
    ClubAndActivity,
    CampusLifeInfo,
)
from app.schemas.admin import (
    LoginRequest,
    TokenResponse,
    DashboardMetricsResponse,
    SystemConfigDTO,
    SystemConfigUpdate,
    RandomEventDTO,
    RandomEventCreate,
    RandomEventUpdate,
    SandboxTestRequest,
    SandboxTestResponse,
)
from app.schemas.llm import TurnGenerationSchema, OptionItem
from app.core.security import verify_password, create_access_token, get_current_admin
from app.core.llm_client import call_ollama_structured
from app.services.prompts import TURN_NARRATIVE_PROMPT_TEMPLATE
from app.services.rag_service import course_rag_service

router = APIRouter(prefix="/admin", tags=["Admin CMS"])

# 合規開源模型清單與研發機構
AVAILABLE_MODELS = [
    {"id": "gemma3:4b", "name": "Gemma-3-4B-It", "org": "美國 Google", "type": "輕量推論首選"},
    {"id": "gemma2:9b", "name": "Gemma-2-9B-It", "org": "美國 Google", "type": "高品質深度推理"},
    {"id": "llama3.1:8b", "name": "Llama-3.1-8B-Instruct", "org": "美國 Meta", "type": "綜合邏輯表現優異"},
    {"id": "taide-lx:8b", "name": "Llama-3.1-TAIDE-LX-8B", "org": "台灣 國科會", "type": "純正台灣繁中在地化"},
    {"id": "breeze:7b", "name": "Breeze-7B-Instruct", "org": "台灣 聯發科 MediaTek", "type": "繁體中文優化模型"}
]

@router.post("/auth/login", response_model=TokenResponse)
def admin_login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤"
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=user.username,
        role=user.role
    )

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_sessions = db.query(GameSession).count()
    config = db.query(SystemConfig).first()
    active_model = config.active_llm_model if config else "gemma3:4b"
    event_prob = config.event_trigger_prob if config else 0.35

    total_courses = db.query(Course).count()
    synced_courses = db.query(Course).filter(Course.is_synced_vec == True).count()

    # 統計熱門體驗系所
    sessions = db.query(GameSession).all()
    dept_counts: dict[str, int] = {}
    club_counts: dict[str, int] = {}

    for s in sessions:
        prof = s.player_profile or {}
        dept = prof.get("department", "資訊管理學系")
        dept_counts[dept] = dept_counts.get(dept, 0) + 1

        for c in prof.get("clubs", []):
            club_counts[c] = club_counts.get(c, 0) + 1

    pop_depts = sorted([{"name": k, "count": v} for k, v in dept_counts.items()], key=lambda x: x["count"], reverse=True)[:5]
    pop_clubs = sorted([{"name": k, "count": v} for k, v in club_counts.items()], key=lambda x: x["count"], reverse=True)[:5]

    return DashboardMetricsResponse(
        total_sessions=total_sessions,
        popular_departments=pop_depts,
        popular_clubs=pop_clubs,
        active_model=active_model,
        event_trigger_prob=event_prob,
        available_models=AVAILABLE_MODELS,
        total_courses=total_courses,
        synced_courses=synced_courses
    )

@router.get("/config", response_model=SystemConfigDTO)
def get_config(db: Session = Depends(get_db)):
    conf = db.query(SystemConfig).first()
    if not conf:
        conf = SystemConfig(active_llm_model="gemma3:4b", event_trigger_prob=0.35)
        db.add(conf)
        db.commit()
        db.refresh(conf)
    return SystemConfigDTO(
        active_llm_model=conf.active_llm_model,
        event_trigger_prob=conf.event_trigger_prob,
        system_prompt_override=conf.system_prompt_override
    )

@router.put("/config", response_model=SystemConfigDTO)
def update_config(req: SystemConfigUpdate, db: Session = Depends(get_db)):
    conf = db.query(SystemConfig).first()
    if not conf:
        conf = SystemConfig()
        db.add(conf)

    if req.active_llm_model is not None:
        conf.active_llm_model = req.active_llm_model
    if req.event_trigger_prob is not None:
        conf.event_trigger_prob = req.event_trigger_prob
    if req.system_prompt_override is not None:
        conf.system_prompt_override = req.system_prompt_override

    db.commit()
    db.refresh(conf)
    return SystemConfigDTO(
        active_llm_model=conf.active_llm_model,
        event_trigger_prob=conf.event_trigger_prob,
        system_prompt_override=conf.system_prompt_override
    )

@router.get("/events", response_model=List[RandomEventDTO])
def list_random_events(db: Session = Depends(get_db)):
    events = db.query(RandomEvent).all()
    return [RandomEventDTO.model_validate(e) for e in events]

@router.post("/events", response_model=RandomEventDTO)
def create_random_event(req: RandomEventCreate, db: Session = Depends(get_db)):
    existing = db.query(RandomEvent).filter(RandomEvent.id == req.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="事件代碼已存在")

    ev = RandomEvent(
        id=req.id,
        title=req.title,
        is_active=req.is_active,
        weight=req.weight,
        cond_days=req.cond_days,
        cond_slots=req.cond_slots,
        cond_location=req.cond_location,
        cond_min_stamina=req.cond_min_stamina,
        cond_max_stamina=req.cond_max_stamina,
        event_prompt=req.event_prompt,
        preset_options=req.preset_options
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return RandomEventDTO.model_validate(ev)

@router.put("/events/{event_id}", response_model=RandomEventDTO)
def update_random_event(event_id: str, req: RandomEventUpdate, db: Session = Depends(get_db)):
    ev = db.query(RandomEvent).filter(RandomEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="找不到指定事件")

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(ev, k, v)

    db.commit()
    db.refresh(ev)
    return RandomEventDTO.model_validate(ev)

@router.delete("/events/{event_id}")
def delete_random_event(event_id: str, db: Session = Depends(get_db)):
    ev = db.query(RandomEvent).filter(RandomEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="找不到指定事件")
    db.delete(ev)
    db.commit()
    return {"message": f"成功刪除事件 {event_id}"}

@router.post("/events/sandbox", response_model=SandboxTestResponse)
async def live_sandbox_test(req: SandboxTestRequest, db: Session = Depends(get_db)):
    conf = db.query(SystemConfig).first()
    active_model = conf.active_llm_model if conf else "gemma3:4b"

    loc = db.query(CampusLocation).filter(CampusLocation.id == req.location_id).first()
    loc_name = loc.name if loc else "中央大學校園"
    loc_desc = loc.short_desc if loc else "環境清幽"

    opt_hints = [opt.get("intent_hint", "") for opt in req.preset_options]
    while len(opt_hints) < 3:
        opt_hints.append("彈性應對突發狀況")

    prompt = TURN_NARRATIVE_PROMPT_TEMPLATE.format(
        day_name="週三",
        slot_name="上午 (早八/早十)",
        location_name=loc_name,
        location_short_desc=loc_desc,
        schedule_title="突發沙盒即時測試",
        life_snippet="後門早餐店香氣與百花川微風迎面而來。",
        recent_history="正在進行後台 AI 即時生成測試",
        event_instruction=req.event_prompt,
        opt_a_hint=opt_hints[0],
        opt_b_hint=opt_hints[1],
        opt_c_hint=opt_hints[2],
    )

    fallback_story = TurnGenerationSchema(
        narrative=f"【沙盒即時預覽】你身處在{loc_name}。{req.event_prompt} 面對這起突發狀況，你的內心迅速盤算著各種因應方案。",
        options=[
            OptionItem(option_key="A", display_text=opt_hints[0][:24]),
            OptionItem(option_key="B", display_text=opt_hints[1][:24]),
            OptionItem(option_key="C", display_text=opt_hints[2][:24]),
        ]
    )

    try:
        story = await call_ollama_structured(
            user_prompt=prompt,
            response_schema=TurnGenerationSchema,
            model_name=active_model,
            fallback_instance=fallback_story,
            timeout=25.0
        )
    except Exception:
        story = fallback_story

    return SandboxTestResponse(generated_story=story)

@router.put("/locations/{loc_id}")
def update_location_node(loc_id: str, data: Dict[str, Any], db: Session = Depends(get_db)):
    loc = db.query(CampusLocation).filter(CampusLocation.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="找不到指定場域")

    if "three_mesh_name" in data:
        loc.three_mesh_name = data["three_mesh_name"]
    if "camera_pos" in data:
        loc.camera_pos = data["camera_pos"]
    if "short_desc" in data:
        loc.short_desc = data["short_desc"]
    if "full_content" in data:
        loc.full_content = data["full_content"]

    db.commit()
    db.refresh(loc)
    return {"message": "場域節點資料更新成功", "location": loc.id}

@router.post("/courses/sync")
def trigger_vector_sync(db: Session = Depends(get_db)):
    unsynced = db.query(Course).filter(Course.is_synced_vec == False).all()
    if not unsynced:
        # If all synced, we can resync all
        unsynced = db.query(Course).all()

    course_dicts = [
        {
            "id": c.id,
            "course_name": c.course_name,
            "department": c.department,
            "grade": c.grade,
            "semester_term": c.semester_term,
            "category": c.category,
            "day_of_week": c.day_of_week,
            "period_slot": c.period_slot,
            "location_id": c.location_id,
            "syllabus_summary": c.syllabus_summary,
            "credits": c.credits,
            "instructor": c.instructor,
            "raw_schedule": c.raw_schedule,
        }
        for c in unsynced
    ]

    synced_count = course_rag_service.sync_courses_to_qdrant(course_dicts)
    for c in unsynced:
        c.is_synced_vec = True
    db.commit()

    return {"message": f"成功同步 {synced_count} 門課程至 Qdrant 雙向量庫！", "count": synced_count}
