import json
import re
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models.tables import (
    AdminUser,
    CampusLifeInfo,
    CampusLocation,
    ClubAndActivity,
    Course,
    RandomEvent,
    SystemConfig,
)
from app.services.rag_service import course_rag_service


def seed_database():
    print("--- 正在初始化 SQLite 資料庫表格 ---")
    Base.metadata.create_all(bind=engine)

    seed_file = backend_dir / "data" / "seed_data.json"
    if not seed_file.exists():
        print(f"錯誤：找不到種子資料檔案 {seed_file}")
        return

    with open(seed_file, encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        # 1. 校園館舍節點
        print("1. 匯入校園建築與 3D 地圖節點...")
        for loc in data.get("campus_locations", []):
            if not db.query(CampusLocation).filter(CampusLocation.id == loc["id"]).first():
                db.add(CampusLocation(
                    id=loc["id"],
                    name=loc["name"],
                    category=loc["category"],
                    three_mesh_name=loc.get("three_mesh_name"),
                    camera_pos=loc.get("camera_pos"),
                    short_desc=loc["short_desc"],
                    full_content=loc["full_content"],
                    image_url=loc.get("image_url")
                ))
        db.commit()

        # 2. 歷年課程
        print("2. 匯入結構化歷年課程...")
        courses_to_sync = []
        for c in data.get("courses", []):
            existing = db.query(Course).filter(Course.id == c["id"]).first()
            if not existing:
                course_obj = Course(
                    id=c["id"],
                    semester=c["semester"],
                    department=c["department"],
                    grade=c["grade"],
                    semester_term=c["semester_term"],
                    course_name=c["course_name"],
                    instructor=c["instructor"],
                    category=c["category"],
                    credits=c["credits"],
                    day_of_week=c["day_of_week"],
                    period_slot=c["period_slot"],
                    raw_schedule=c["raw_schedule"],
                    location_id=c.get("location_id"),
                    syllabus_summary=c["syllabus_summary"],
                    is_synced_vec=False
                )
                db.add(course_obj)
                courses_to_sync.append(c)
        db.commit()

        # 3. 社團與活動
        print("3. 匯入中央大學真實社團與學生活動...")
        clubs_file = backend_dir / "data" / "ncu_clubs.json"
        if clubs_file.exists():
            with open(clubs_file, encoding="utf-8") as cf:
                real_clubs = json.load(cf)

            db.query(ClubAndActivity).delete()
            type_mapping = {
                "學術性": "academic_club",
                "康樂性": "recreation_club",
                "體育性": "sports_club",
                "服務性": "service_club",
                "聯誼性": "social_club",
                "系學會": "student_org",
            }

            for idx, item in enumerate(real_clubs, 1):
                img = item.get("圖片網址") or ""
                m = re.search(r'/([^/]+)\.(?:png|jpg|jpeg|gif)', img, re.I)
                code = m.group(1).lower() if m else ""
                eng = re.sub(r'[^a-zA-Z0-9_]', '', (item.get("英文名稱或縮寫") or "").strip().lower())
                if code:
                    cid = f"club_{code}"
                elif eng and len(eng) >= 3:
                    cid = f"club_{eng[:30]}"
                else:
                    cid = f"club_{idx:03d}"

                cat = item.get("社團分類") or "其它"
                mapped_type = type_mapping.get(cat, "recreation_club")
                name = item.get("中文名稱", "").strip()
                intro = item.get("中文簡介", "").strip()
                english_name = item.get("英文名稱或縮寫", "").strip() or None
                english_intro = item.get("英文簡介", "").strip() or None
                loc_text = item.get("社辦地點", "").strip() or None
                web_url = item.get("社團網站", "").strip() or None
                img_url = item.get("圖片網址", "").strip() or None
                p_ctx = f"在中大參與{name}（{cat}社團）活動，{intro[:100]}" if intro else f"在中大參加{name}社團日常活動與交流"

                db.add(ClubAndActivity(
                    id=cid,
                    name=name,
                    english_name=english_name,
                    type=mapped_type,
                    category=cat,
                    day_of_week=(idx % 5) + 1,
                    period_slot="evening",
                    location_id=None,
                    location_text=loc_text,
                    website_url=web_url,
                    image_url=img_url,
                    prompt_context=p_ctx,
                    full_intro=intro or f"{name}是中央大學活躍的{cat}學生組織。",
                    english_intro=english_intro,
                ))
            db.commit()
            print(f"   成功匯入 {len(real_clubs)} 個真實社團資料！")
        else:
            for act in data.get("clubs_and_activities", []):
                if not db.query(ClubAndActivity).filter(ClubAndActivity.id == act["id"]).first():
                    db.add(ClubAndActivity(
                        id=act["id"],
                        name=act["name"],
                        type=act["type"],
                        day_of_week=act["day_of_week"],
                        period_slot=act["period_slot"],
                        location_id=act.get("location_id"),
                        prompt_context=act["prompt_context"],
                        full_intro=act["full_intro"]
                    ))
            db.commit()

        # 4. 百科飲食交通生活細節
        print("4. 匯入校園生活百科...")
        for info in data.get("campus_life_info", []):
            if not db.query(CampusLifeInfo).filter(CampusLifeInfo.title == info["title"]).first():
                db.add(CampusLifeInfo(
                    info_type=info["info_type"],
                    title=info["title"],
                    location_id=info.get("location_id"),
                    tags=info["tags"],
                    game_snippet=info["game_snippet"],
                    content_md=info["content_md"]
                ))
        db.commit()

        # 5. 突發事件池
        print("5. 匯入模擬遊戲突發事件...")
        for evt in data.get("random_events", []):
            if not db.query(RandomEvent).filter(RandomEvent.id == evt["id"]).first():
                db.add(RandomEvent(
                    id=evt["id"],
                    title=evt["title"],
                    is_active=evt.get("is_active", True),
                    weight=evt.get("weight", 10),
                    cond_days=evt.get("cond_days"),
                    cond_slots=evt.get("cond_slots"),
                    cond_location=evt.get("cond_location"),
                    cond_min_stamina=evt.get("cond_min_stamina", 0),
                    cond_max_stamina=evt.get("cond_max_stamina", 100),
                    event_prompt=evt["event_prompt"],
                    preset_options=evt["preset_options"]
                ))
        db.commit()

        # 6. 管理員帳號與系統設定
        print("6. 建立預設管理員與系統組態...")
        admin_user = settings.ADMIN_DEFAULT_USERNAME
        admin_pass = settings.ADMIN_DEFAULT_PASSWORD
        if not db.query(AdminUser).filter(AdminUser.username == admin_user).first():
            db.add(AdminUser(
                username=admin_user,
                password_hash=get_password_hash(admin_pass),
                role="admin"
            ))

        if not db.query(SystemConfig).first():
            sys_conf = data.get("system_config", {})
            db.add(SystemConfig(
                active_llm_model=sys_conf.get("active_llm_model", "gemma3:4b"),
                event_trigger_prob=sys_conf.get("event_trigger_prob", 0.35),
                system_prompt_override=sys_conf.get("system_prompt_override")
            ))
        db.commit()

        # 7. FastEmbed 向量同步到 Qdrant
        all_courses = db.query(Course).all()
        print(f"7. 正在使用 FastEmbed 同步 {len(all_courses)} 門課程至 Qdrant 雙向量索引...")
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
            for c in all_courses
        ]
        synced_count = course_rag_service.sync_courses_to_qdrant(course_dicts)
        for c in all_courses:
            c.is_synced_vec = True
        db.commit()
        print(f"成功同步 {synced_count} 門課程至 Qdrant 本地向量庫！")

        print("=== 資料庫與向量索引初始化完成！ ===")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
