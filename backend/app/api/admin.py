import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.core.llm_client import call_ollama_structured
from app.core.security import create_access_token, get_current_admin, get_password_hash, verify_password
from app.models.tables import (
    AdminUser,
    CampusActivity,
    CampusLocation,
    Course,
    GameSession,
    RandomEvent,
    SystemConfig,
)
from app.schemas.admin import (
    CampusActivityCreate,
    CampusActivityDTO,
    CampusActivityUpdate,
    DashboardMetricsResponse,
    LoginRequest,
    RandomEventCreate,
    RandomEventDTO,
    RandomEventUpdate,
    SandboxTestRequest,
    SandboxTestResponse,
    SystemConfigDTO,
    SystemConfigUpdate,
    TokenResponse,
)
from app.schemas.courses import (
    VectorProjectRequest,
    VectorProjectResponse,
    VectorUniverseResponse,
)
from app.schemas.llm import OptionItem, TurnGenerationSchema
from app.services.course_db import course_db_service
from app.services.course_vector_service import course_vector_service
from app.services.prompts import TURN_NARRATIVE_PROMPT_TEMPLATE
from app.services.rag_service import course_rag_service

router = APIRouter(prefix="/admin", tags=["Admin CMS"])

def ensure_admin_seeded(db: Session):
    Base.metadata.create_all(bind=engine)
    admin_user = settings.ADMIN_DEFAULT_USERNAME
    existing = db.query(AdminUser).filter(AdminUser.username == admin_user).first()
    if not existing:
        db.add(AdminUser(
            username=admin_user,
            password_hash=get_password_hash(settings.ADMIN_DEFAULT_PASSWORD),
            role="admin"
        ))
        db.commit()

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
    ensure_admin_seeded(db)
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

@router.get("/auth/me")
def get_current_admin_info(current_admin: AdminUser = Depends(get_current_admin)):
    return {
        "username": current_admin.username,
        "role": current_admin.role,
        "is_authenticated": True
    }

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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
def get_config(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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
def update_config(
    req: SystemConfigUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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

@router.get("/events", response_model=list[RandomEventDTO])
def list_random_events(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    events = db.query(RandomEvent).all()
    return [RandomEventDTO.model_validate(e) for e in events]

@router.post("/events", response_model=RandomEventDTO)
def create_random_event(
    req: RandomEventCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(RandomEvent).filter(RandomEvent.id == req.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="事件代碼已存在")

    ev = RandomEvent(
        id=req.id,
        title=req.title,
        is_active=req.is_active,
        weight=req.weight,
        trigger_rate=req.trigger_rate,
        cond_days=req.cond_days,
        cond_slots=req.cond_slots,
        cond_time_start=req.cond_time_start,
        cond_time_end=req.cond_time_end,
        cond_activity_type=req.cond_activity_type,
        cond_activity_title=req.cond_activity_title,
        cond_prev_activity=req.cond_prev_activity,
        cond_prev_event_id=req.cond_prev_event_id,
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
def update_random_event(
    event_id: str,
    req: RandomEventUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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
def delete_random_event(
    event_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ev = db.query(RandomEvent).filter(RandomEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="找不到指定事件")
    db.delete(ev)
    db.commit()
    return {"message": f"成功刪除事件 {event_id}"}

@router.post("/events/sandbox", response_model=SandboxTestResponse)
async def live_sandbox_test(
    req: SandboxTestRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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


# ==========================================
# 校園動態活動管理 (早餐、午餐、晚餐、宿舍休閒、校園休閒)
# ==========================================

DEFAULT_CAMPUS_ACTIVITIES: list[dict[str, Any]] = [
    {
        "id": "act_breakfast",
        "title": "晨光活力早餐",
        "category": "breakfast",
        "trigger_type": "time_slot",
        "trigger_timing": "07:00~09:00",
        "trigger_mode": "manual_choice",
        "location_id": "loc_backgate",
        "location_name": "後門美食一條街",
        "is_active": True,
        "weight": 15,
        "event_prompt": "清晨的微風拂過百花川與松林，距離晨光早課還有一點時間，校園各處飄來熱騰騰煎蛋餅、飯糰與現煮黑咖啡的香氣。是否要前去享用早餐？",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "衝後門早午餐店點現做起司蛋餅與大杯溫豆漿，元氣滿滿迎接早課",
                "effects": {"stamina": 20, "study": 5, "social": 0, "money": -65},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "在超商快速抓一顆御飯糰與美式咖啡邊走邊吃，節省時間",
                "effects": {"stamina": 10, "study": 0, "social": 0, "money": -45},
                "marks_activity": True
            },
            {
                "option_key": "C",
                "intent_hint": "多賴床十分鐘或直接趕去教室佔位置，今天先不吃早餐",
                "effects": {"stamina": -5, "study": 5, "social": 0, "money": 0},
                "marks_activity": False
            }
        ]
    },
    {
        "id": "act_lunch",
        "title": "午膳美味時光",
        "category": "lunch",
        "trigger_type": "time_slot",
        "trigger_timing": "11:50~13:30",
        "trigger_mode": "manual_choice",
        "location_id": "loc_pine_restaurant",
        "location_name": "松果餐廳",
        "is_active": True,
        "weight": 20,
        "event_prompt": "第四節下課鐘聲敲響，中午覓食人潮湧向松果餐廳與校園後門。當前為午餐時間，即可選擇是否要觸發午餐活動？",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "快步走進松果餐廳吃高CP值雙主菜自助餐，補充充沛體力",
                "effects": {"stamina": 25, "study": 0, "social": 5, "money": -90},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "揪同學散步到後門吃現炒泡麵或燒臘便當，配上一杯手搖茶",
                "effects": {"stamina": 20, "study": 0, "social": 15, "money": -120},
                "marks_activity": True
            },
            {
                "option_key": "C",
                "intent_hint": "不吃午餐，留在安靜的教室趴著補眠小憩或自習預習下午內容",
                "effects": {"stamina": 5, "study": 10, "social": -5, "money": 0},
                "marks_activity": False
            }
        ]
    },
    {
        "id": "act_dinner",
        "title": "晚餐與宵夜探索",
        "category": "dinner",
        "trigger_type": "time_slot",
        "trigger_timing": "17:30~19:30",
        "trigger_mode": "manual_choice",
        "location_id": "loc_night_street",
        "location_name": "中大宵夜街",
        "is_active": True,
        "weight": 18,
        "event_prompt": "夕陽西下，天色漸漸染上暮色，下課的步履輕快起來。宵夜街與後門店家亮起溫暖燈光，炭烤、滷味與鍋燒麵香氣撲鼻。是否要進行晚餐活動？",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "與室友或社團夥伴一同前往宵夜街享用熱騰騰拉麵與現炸地瓜球",
                "effects": {"stamina": 25, "study": 0, "social": 15, "money": -150},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "買一份少油少鹽的健康水煮餐便當外帶回宿舍享用",
                "effects": {"stamina": 15, "study": 5, "social": 0, "money": -95},
                "marks_activity": True
            },
            {
                "option_key": "C",
                "intent_hint": "全神貫注準備晚間的專題報告或作業，暫時省去晚餐時間",
                "effects": {"stamina": -10, "study": 15, "social": 0, "money": 0},
                "marks_activity": False
            }
        ]
    },
    {
        "id": "act_dorm_leisure",
        "title": "宿舍小憩與深度補眠",
        "category": "dorm_leisure",
        "trigger_type": "class_break",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "loc_dorm_girl14",
        "location_name": "學生宿舍房內",
        "is_active": True,
        "weight": 15,
        "event_prompt": "下課後迎來難得的空閒時間，回到宿舍的房間，床鋪正在召喚你。",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "戴上眼罩深度補眠充電",
                "effects": {"stamina": 25, "study": 0, "social": 0, "money": 0},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "躺床上聽音樂放空放鬆",
                "effects": {"stamina": 18, "study": 0, "social": 0, "money": 0},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_dorm_gaming",
        "title": "手遊開黑 / 線上追劇",
        "category": "dorm_leisure",
        "trigger_type": "class_break",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "loc_dorm_girl14",
        "location_name": "學生宿舍書桌",
        "is_active": True,
        "weight": 15,
        "event_prompt": "回到宿舍，打開電腦與手機，今晚想和室友開黑，還是追追最新的影集？",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "與室友開黑打傳說對決",
                "effects": {"stamina": 15, "study": 0, "social": 10, "money": 0},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "吃零食追最新熱門影集",
                "effects": {"stamina": 15, "study": 0, "social": 5, "money": 0},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_dorm_chores",
        "title": "洗衣服整理寢室環境",
        "category": "dorm_leisure",
        "trigger_type": "class_break",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "loc_dorm_girl14",
        "location_name": "宿舍洗衣間 / 寢室",
        "is_active": True,
        "weight": 15,
        "event_prompt": "衣服堆了一籃，書桌也有點亂，是時候整理一下寢室環境了。",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "排隊洗烘衣物、收拾書桌",
                "effects": {"stamina": 10, "study": 5, "social": 5, "money": 0},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_campus_leisure",
        "title": "宵夜街 / 後門炭烤美食探訪",
        "category": "campus_leisure",
        "trigger_type": "free_time",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "bldg_street_night",
        "location_name": "後門宵夜街",
        "is_active": True,
        "weight": 15,
        "event_prompt": "夜色漸濃，後門宵夜街的炭烤香氣飄了過來，要不要去探訪一下？",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "炭烤雞排配冰鎮奶茶",
                "effects": {"stamina": 22, "study": 0, "social": 12, "money": -120},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "滷味鹹酥雞宵夜小聚",
                "effects": {"stamina": 18, "study": 0, "social": 15, "money": -100},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_campus_gym",
        "title": "依仁堂體育館揮灑汗水",
        "category": "campus_leisure",
        "trigger_type": "free_time",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "bldg_yireng",
        "location_name": "依仁堂體育館 / 健身房",
        "is_active": True,
        "weight": 15,
        "event_prompt": "空檔時間想動一動，依仁堂的健身房與球場隨時歡迎你。",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "重訓器材核心自主鍛鍊",
                "effects": {"stamina": 12, "study": 0, "social": 8, "money": 0},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "室內慢跑或打羽球交流",
                "effects": {"stamina": 15, "study": 0, "social": 10, "money": 0},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_campus_library",
        "title": "總圖書館 / K書中心沉浸充實",
        "category": "campus_leisure",
        "trigger_type": "free_time",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "bldg_lib_main",
        "location_name": "總圖書館 / 舊圖K書中心",
        "is_active": True,
        "weight": 15,
        "event_prompt": "找個安靜的座位，把課業進度往前推一些。",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "安靜閱覽區溫習課程講義",
                "effects": {"stamina": 0, "study": 22, "social": 0, "money": 0},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "翻閱科技新知與課外讀物",
                "effects": {"stamina": 0, "study": 15, "social": 5, "money": 0},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_campus_lake",
        "title": "中大湖夜景散步",
        "category": "campus_leisure",
        "trigger_type": "free_time",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": "bldg_view_lake",
        "location_name": "中大湖畔",
        "is_active": True,
        "weight": 15,
        "event_prompt": "晚風徐徐，中大湖畔的夜景很適合散步沉澱心情。",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "湖畔夜風散心放鬆",
                "effects": {"stamina": 16, "study": 0, "social": 8, "money": 0},
                "marks_activity": True
            },
            {
                "option_key": "B",
                "intent_hint": "大草坪看星空沉澱心靈",
                "effects": {"stamina": 18, "study": 0, "social": 0, "money": 0},
                "marks_activity": True
            }
        ]
    },
    {
        "id": "act_campus_sport",
        "title": "運動",
        "category": "campus_leisure",
        "trigger_type": "free_time",
        "trigger_timing": "下課空閒時間",
        "trigger_mode": "manual_choice",
        "location_id": None,
        "location_name": "校園運動場館",
        "is_active": True,
        "weight": 15,
        "event_prompt": "空檔時間想動一動。校園裡有田徑場、球場、游泳池、羽球館與攀岩場，可以在 3D 地圖上挑一處前往運動。",
        "preset_options": [
            {
                "option_key": "A",
                "intent_hint": "到選定的運動場館活動筋骨",
                "effects": {"stamina": 15, "study": 0, "social": 5, "money": 0},
                "marks_activity": True
            }
        ]
    }
]

# 程式邏輯會用到的活動：即使資料庫已有其他活動，缺少時也要補上
REQUIRED_ACTIVITY_IDS = {
    "act_campus_sport",
    "act_dorm_gaming", "act_dorm_chores",
    "act_campus_gym", "act_campus_library", "act_campus_lake",
}
# 舊版把整類活動塞在同一筆資料裡（A/B/C 三個方案）；偵測到仍是舊內容才改寫，不會蓋掉管理員改過的資料
LEGACY_ACTIVITY_TITLES = {"act_dorm_leisure": "宿舍休閒放鬆", "act_campus_leisure": "校園設施與戶外休閒"}


def _activity_from_default(item: dict[str, Any]) -> CampusActivity:
    return CampusActivity(
        id=item["id"],
        title=item["title"],
        category=item["category"],
        trigger_type=item["trigger_type"],
        trigger_timing=item["trigger_timing"],
        trigger_mode=item["trigger_mode"],
        location_id=item.get("location_id"),
        location_name=item.get("location_name"),
        is_active=item["is_active"],
        weight=item["weight"],
        event_prompt=item["event_prompt"],
        preset_options=item["preset_options"],
    )


def ensure_activities_seeded(db: Session):
    Base.metadata.create_all(bind=engine)
    count = db.query(CampusActivity).count()
    existing = {a.id: a for a in db.query(CampusActivity).all()} if count else {}
    changed = False
    for item in DEFAULT_CAMPUS_ACTIVITIES:
        current = existing.get(item["id"])
        if current is None:
            # 全新資料庫補齊全部預設；已有資料時只補程式邏輯需要的活動
            if count == 0 or item["id"] in REQUIRED_ACTIVITY_IDS:
                db.add(_activity_from_default(item))
                changed = True
        elif LEGACY_ACTIVITY_TITLES.get(item["id"]) == current.title:
            # 舊版把整類活動擠在同一筆（A/B/C 三個方案），升級成拆開後的版本
            fresh = _activity_from_default(item)
            for col in (
                "title", "category", "trigger_type", "trigger_timing", "trigger_mode",
                "location_id", "location_name", "is_active", "weight", "event_prompt", "preset_options",
            ):
                setattr(current, col, getattr(fresh, col))
            changed = True
    if changed:
        db.commit()

@router.get("/activities", response_model=list[CampusActivityDTO])
def list_campus_activities(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ensure_activities_seeded(db)
    activities = db.query(CampusActivity).all()
    return [CampusActivityDTO.model_validate(a) for a in activities]

@router.post("/activities", response_model=CampusActivityDTO)
def create_campus_activity(
    req: CampusActivityCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    ensure_activities_seeded(db)
    existing = db.query(CampusActivity).filter(CampusActivity.id == req.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="活動代碼已存在")

    act = CampusActivity(
        id=req.id,
        title=req.title,
        category=req.category,
        trigger_type=req.trigger_type,
        trigger_timing=req.trigger_timing,
        trigger_mode=req.trigger_mode,
        location_id=req.location_id,
        location_name=req.location_name,
        is_active=req.is_active,
        weight=req.weight,
        event_prompt=req.event_prompt,
        preset_options=req.preset_options
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return CampusActivityDTO.model_validate(act)

@router.put("/activities/{activity_id}", response_model=CampusActivityDTO)
def update_campus_activity(
    activity_id: str,
    req: CampusActivityUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    act = db.query(CampusActivity).filter(CampusActivity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到指定活動")

    update_data = req.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(act, k, v)

    db.commit()
    db.refresh(act)
    return CampusActivityDTO.model_validate(act)

@router.delete("/activities/{activity_id}")
def delete_campus_activity(
    activity_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    act = db.query(CampusActivity).filter(CampusActivity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到指定活動")
    db.delete(act)
    db.commit()
    return {"message": f"成功刪除活動 {activity_id}"}

@router.post("/activities/seed-defaults", response_model=list[CampusActivityDTO])
def seed_default_activities(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    for item in DEFAULT_CAMPUS_ACTIVITIES:
        act = db.query(CampusActivity).filter(CampusActivity.id == item["id"]).first()
        if not act:
            act = CampusActivity(
                id=item["id"],
                title=item["title"],
                category=item["category"],
                trigger_type=item["trigger_type"],
                trigger_timing=item["trigger_timing"],
                trigger_mode=item["trigger_mode"],
                location_id=item.get("location_id"),
                location_name=item.get("location_name"),
                is_active=item["is_active"],
                weight=item["weight"],
                event_prompt=item["event_prompt"],
                preset_options=item["preset_options"],
            )
            db.add(act)
        else:
            act.title = item["title"]
            act.category = item["category"]
            act.trigger_type = item["trigger_type"]
            act.trigger_timing = item["trigger_timing"]
            act.trigger_mode = item["trigger_mode"]
            act.location_id = item.get("location_id")
            act.location_name = item.get("location_name")
            act.is_active = item["is_active"]
            act.weight = item["weight"]
            act.event_prompt = item["event_prompt"]
            act.preset_options = item["preset_options"]
    db.commit()
    activities = db.query(CampusActivity).all()
    return [CampusActivityDTO.model_validate(a) for a in activities]

@router.post("/activities/sandbox", response_model=SandboxTestResponse)
async def activity_sandbox_test(
    req: SandboxTestRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    conf = db.query(SystemConfig).first()
    active_model = conf.active_llm_model if conf else "gemma3:4b"

    loc = db.query(CampusLocation).filter(CampusLocation.id == req.location_id).first()
    loc_name = loc.name if loc else "中央大學校園"
    loc_desc = loc.short_desc if loc else "環境清幽"

    opt_hints = [opt.get("intent_hint", "") for opt in req.preset_options]
    while len(opt_hints) < 3:
        opt_hints.append("彈性應對校園日常活動")

    prompt = TURN_NARRATIVE_PROMPT_TEMPLATE.format(
        day_name="週一",
        slot_name=req.slot or "中午時段",
        location_name=loc_name,
        location_short_desc=loc_desc,
        schedule_title="校園日常動態活動",
        life_snippet="校園微風徐徐，下課鐘聲在百花川畔迴盪，正是自由展開活動的好時光。",
        recent_history="結束上一時段行程",
        event_instruction=req.event_prompt,
        opt_a_hint=opt_hints[0],
        opt_b_hint=opt_hints[1],
        opt_c_hint=opt_hints[2],
    )

    fallback_story = TurnGenerationSchema(
        narrative=f"【活動即時預覽】你身處在{loc_name}。{req.event_prompt} 陽光灑落校園，眼前多樣的選擇讓你充滿期待。",
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
def update_location_node(
    loc_id: str,
    data: dict[str, Any],
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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
def trigger_vector_sync(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
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


# =========================================================================
# 3D Campus Model (.glb) Management Endpoints
# =========================================================================

def get_model_paths():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    model_dir = project_root / "frontend" / "public" / "models"
    model_file = model_dir / "campus_buildings.glb"
    backup_file = model_dir / "campus_buildings.glb.bak"
    return model_dir, model_file, backup_file


@router.get("/model/info")
def get_campus_model_info(current_admin: AdminUser = Depends(get_current_admin)):
    """取得伺服器目前 3D 地圖模型檔案狀態"""
    _, model_file, backup_file = get_model_paths()

    info = {
        "exists": model_file.exists(),
        "filename": "campus_buildings.glb",
        "file_size_bytes": 0,
        "file_size_formatted": "0 KB",
        "last_modified": None,
        "has_backup": backup_file.exists(),
        "backup_size_formatted": "0 KB" if not backup_file.exists() else f"{backup_file.stat().st_size / 1024:.1f} KB",
        "backup_last_modified": None if not backup_file.exists() else datetime.fromtimestamp(backup_file.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
    }

    if model_file.exists():
        stat = model_file.stat()
        size_bytes = stat.st_size
        info["file_size_bytes"] = size_bytes
        info["file_size_formatted"] = (
            f"{size_bytes / 1024:.1f} KB" if size_bytes < 1024 * 1024
            else f"{size_bytes / (1024 * 1024):.2f} MB"
        )
        info["last_modified"] = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

    return info


@router.post("/model/upload")
async def upload_campus_model(
    file: UploadFile = File(...),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """上傳新版本 3D 校園地圖模型 (.glb) 到伺服器，自動備份上一版檔案"""
    filename = file.filename or ""
    if not filename.lower().endswith(".glb"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支援的檔案格式，請上傳 .glb 格式之 3D 模型檔案"
        )

    content = await file.read()
    if len(content) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="檔案損毀或無效的 GLB 檔案（檔案過小）"
        )

    # 驗證 glTF binary 魔術位元組
    magic = content[:4]
    if magic != b"glTF":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無效的 GLB 檔案：Magic header 不是 'glTF'"
        )

    # 檔案大小限制 100MB
    max_size = 100 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="檔案過大，GLB 模型檔案上限為 100MB"
        )

    model_dir, model_file, backup_file = get_model_paths()
    model_dir.mkdir(parents=True, exist_ok=True)

    # 備份原檔案
    backup_created = False
    if model_file.exists():
        try:
            shutil.copy2(model_file, backup_file)
            backup_created = True
        except Exception as e:
            print(f"備份舊模型時警告: {e}")

    # 寫入新檔案
    with open(model_file, "wb") as f:
        f.write(content)

    size_formatted = (
        f"{len(content) / 1024:.1f} KB" if len(content) < 1024 * 1024
        else f"{len(content) / (1024 * 1024):.2f} MB"
    )

    return {
        "status": "success",
        "message": "校園 3D 地圖模型 (campus_buildings.glb) 上傳並更新成功！",
        "filename": filename,
        "size_bytes": len(content),
        "size_formatted": size_formatted,
        "backup_created": backup_created,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# =========================================================================
# 3D Vector Database Visualization & Real-time Projection Endpoints
# =========================================================================

@router.get("/vector-space/data", response_model=VectorUniverseResponse)
def get_vector_space_data(current_admin: AdminUser = Depends(get_current_admin)):
    """取得 3D 向量星系投影之全量課程節點與降維座標"""
    try:
        data = course_vector_service.get_3d_universe_data()
        return VectorUniverseResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"讀取 3D 向量資料失敗: {str(e)}") from e


@router.post("/vector-space/project", response_model=VectorProjectResponse)
def project_query_in_vector_space(
    req: VectorProjectRequest,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """即時將輸入之自然語言需求投影為 3D 向量空間座標，並回傳 Top-K 鄰近連線課程"""
    try:
        result = course_vector_service.project_query_3d(
            query=req.query,
            top_k=req.top_k,
            semester=req.semester,
            department=req.department
        )
        return VectorProjectResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"即時向量投影計算失敗: {str(e)}") from e


@router.get("/vector-space/stats")
def get_vector_space_stats(current_admin: AdminUser = Depends(get_current_admin)):
    """取得向量資料庫統計資訊（集合名稱、維度、模型、學期佔比等）"""
    universe = course_vector_service.get_3d_universe_data()
    meta = course_db_service.get_meta()
    return {
        "collection_name": "ncu_courses",
        "embedding_model": "BAAI/bge-small-zh-v1.5",
        "dimensions": 512,
        "distance_metric": "cosine",
        "total_courses": universe.get("total", 0),
        "semesters": meta.get("semesters", []),
        "department_count": len(meta.get("departments", [])),
    }
