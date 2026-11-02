import json
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import Base, engine, get_db
from app.models.tables import Building, CampusLifeInfo, CampusLocation, ClubAndActivity
from app.schemas.explore import (
    BuildingResponse,
    CampusLifeItem,
    ClubCategorySummary,
    ClubResponse,
    LocationDetailResponse,
    LocationResponse,
)

router = APIRouter(prefix="/explore", tags=["Explore & 3D Map"])

def ensure_buildings_seeded(db: Session):
    Base.metadata.create_all(bind=engine)
    count = db.query(Building).count()
    if count == 0:
        buildings_file = Path(__file__).resolve().parent.parent.parent / "data" / "buildings.json"
        if buildings_file.exists():
            with open(buildings_file, encoding="utf-8") as f:
                bldgs = json.load(f)
            for b in bldgs:
                db.add(Building(
                    id=b["id"],
                    name_zh=b["name_zh"],
                    name_en=b.get("name_en"),
                    category=b.get("category"),
                    classroom_code=b.get("classroom_code"),
                    departments=b.get("departments") or [],
                    alias=b.get("alias"),
                    description=b.get("description"),
                ))
            db.commit()


# Common NCU department/school abbreviations for smarter search
COMMON_ACRONYMS = {
    "資工": "資訊工程",
    "資管": "資訊管理",
    "電機": "電機工程",
    "通訊": "通訊工程",
    "機械": "機械工程",
    "土木": "土木工程",
    "化材": "化學工程與材料工程",
    "生科": "生命科學",
    "生醫": "生醫科學與工程",
    "光電": "光電科學與工程",
    "企管": "企業管理",
    "財金": "財務金融",
    "經研": "經濟",
    "中研": "中國文學",
    "英文": "英美語文",
    "法文": "法國語文",
    "地科": "地球科學",
    "大氣": "大氣科學",
}


@router.get("/buildings", response_model=list[BuildingResponse])
def get_buildings(
    q: str | None = Query(None, description="搜尋關鍵字 (id, name_zh, name_en, classroom_code, alias, departments)"),
    category: str | None = Query(None, description="建築物分類篩選"),
    db: Session = Depends(get_db)
):
    ensure_buildings_seeded(db)
    query = db.query(Building)

    if category and category.lower() != "all":
        query = query.filter(Building.category == category)

    all_bldgs = query.order_by(Building.name_zh).all()

    if q and q.strip():
        term = q.strip().lower()
        expanded_term = COMMON_ACRONYMS.get(q.strip(), "").lower()

        matched = []
        for b in all_bldgs:
            id_val = (b.id or "").lower()
            name_zh_val = (b.name_zh or "").lower()
            name_en_val = (b.name_en or "").lower()
            code_val = (b.classroom_code or "").lower()
            alias_val = (b.alias or "").lower()
            dept_vals = [(d or "").lower() for d in (b.departments or [])]
            desc_val = (b.description or "").lower()

            def matches(keyword: str) -> bool:
                if not keyword:
                    return False
                return (
                    keyword in id_val
                    or keyword in name_zh_val
                    or keyword in name_en_val
                    or keyword in code_val
                    or keyword in alias_val
                    or any(keyword in d for d in dept_vals)
                    or keyword in desc_val
                )

            if matches(term) or (expanded_term and matches(expanded_term)):
                matched.append(b)

        return matched

    return all_bldgs


@router.get("/buildings/{building_id}", response_model=BuildingResponse)
def get_building_detail(building_id: str, db: Session = Depends(get_db)):
    ensure_buildings_seeded(db)
    bldg = db.query(Building).filter(Building.id == building_id).first()
    if not bldg:
        raise HTTPException(status_code=404, detail=f"找不到指定的建築物 ({building_id})")
    return bldg


@router.get("/locations", response_model=list[LocationResponse])
def get_all_locations(
    category: str | None = Query(None, description="場域類別"),
    db: Session = Depends(get_db)
):
    query = db.query(CampusLocation)
    if category:
        query = query.filter(CampusLocation.category == category)
    locations = query.all()

    result = []
    for loc in locations:
        loc_res = LocationResponse.model_validate(loc)
        loc_res.course_count = len(loc.courses) if loc.courses else 0
        loc_res.activity_count = len(loc.activities) if loc.activities else 0
        result.append(loc_res)

    return result

@router.get("/locations/{loc_id}", response_model=LocationDetailResponse)
def get_location_detail(loc_id: str, db: Session = Depends(get_db)):
    loc = db.query(CampusLocation).filter(CampusLocation.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="找不到指定的校園場域")

    courses = [
        {
            "id": c.id,
            "course_name": c.course_name,
            "department": c.department,
            "credits": c.credits,
            "raw_schedule": c.raw_schedule,
            "instructor": c.instructor,
        }
        for c in loc.courses
    ]

    activities = [
        {
            "id": a.id,
            "name": a.name,
            "type": a.type,
            "day_of_week": a.day_of_week,
            "period_slot": a.period_slot,
            "full_intro": a.full_intro,
        }
        for a in loc.activities
    ]

    life_infos = [
        {
            "id": i.id,
            "info_type": i.info_type,
            "title": i.title,
            "tags": i.tags,
            "game_snippet": i.game_snippet,
            "content_html": i.content_html,
        }
        for i in loc.life_infos
    ]

    detail = LocationDetailResponse.model_validate(loc)
    detail.courses = courses
    detail.activities = activities
    detail.life_infos = life_infos
    detail.course_count = len(courses)
    detail.activity_count = len(activities)
    return detail

@router.get("/life-info", response_model=list[CampusLifeItem])
def get_campus_life_info(
    info_type: str | None = Query(None, description="類別：food, dorm_detail, transport"),
    tag: str | None = Query(None, description="標籤篩選"),
    db: Session = Depends(get_db)
):
    query = db.query(CampusLifeInfo)
    if info_type:
        query = query.filter(CampusLifeInfo.info_type == info_type)

    items = query.all()
    results = []
    for item in items:
        if tag and tag not in (item.tags or []):
            continue
        ci = CampusLifeItem.model_validate(item)
        if item.location:
            ci.location_name = item.location.name
        results.append(ci)
    return results

def ensure_clubs_seeded(db: Session):
    Base.metadata.create_all(bind=engine)
    try:
        count = db.query(ClubAndActivity).count()
    except Exception:
        db.rollback()
        ClubAndActivity.__table__.drop(bind=engine, checkfirst=True)
        ClubAndActivity.__table__.create(bind=engine, checkfirst=True)
        count = 0

    if count < 100:
        clubs_file = Path(__file__).resolve().parent.parent.parent / "data" / "ncu_clubs.json"
        if not clubs_file.exists():
            return
        with open(clubs_file, encoding="utf-8") as f:
            raw_clubs = json.load(f)

        if count > 0:
            db.query(ClubAndActivity).delete()
            db.commit()

        type_mapping = {
            "學術性": "academic_club",
            "康樂性": "recreation_club",
            "體育性": "sports_club",
            "服務性": "service_club",
            "聯誼性": "social_club",
            "系學會": "student_org",
        }

        for idx, item in enumerate(raw_clubs, 1):
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


@router.get("/clubs", response_model=list[ClubResponse])
def get_all_clubs(
    club_type: str | None = Query(None, description="社團類型或分類"),
    category: str | None = Query(None, description="社團分類篩選 (聯誼性/學術性/康樂性/系學會/體育性/服務性)"),
    keyword: str | None = Query(None, description="關鍵字搜尋 (名稱/簡介/社辦)"),
    db: Session = Depends(get_db)
):
    ensure_clubs_seeded(db)
    query = db.query(ClubAndActivity)

    target_filter = category or club_type
    if target_filter:
        type_mapping = {
            "academic_club": "學術性",
            "recreation_club": "康樂性",
            "sports_club": "體育性",
            "service_club": "服務性",
            "social_club": "聯誼性",
            "student_org": "系學會",
        }
        chinese_cat = type_mapping.get(target_filter, target_filter)
        query = query.filter(
            or_(
                ClubAndActivity.category == chinese_cat,
                ClubAndActivity.type == target_filter,
                ClubAndActivity.category == target_filter
            )
        )

    if keyword:
        kw = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                ClubAndActivity.name.ilike(kw),
                ClubAndActivity.english_name.ilike(kw),
                ClubAndActivity.full_intro.ilike(kw),
                ClubAndActivity.location_text.ilike(kw)
            )
        )

    clubs = query.order_by(ClubAndActivity.category, ClubAndActivity.name).all()
    results = []
    for c in clubs:
        results.append(
            ClubResponse(
                id=c.id,
                name=c.name,
                english_name=c.english_name,
                type=c.type,
                category=c.category or c.type,
                day_of_week=c.day_of_week,
                period_slot=c.period_slot,
                location_id=c.location_id,
                location_name=c.location.name if c.location else (c.location_text or "活動場地"),
                location_text=c.location_text,
                website_url=c.website_url,
                image_url=c.image_url,
                prompt_context=c.prompt_context,
                full_intro=c.full_intro,
                english_intro=c.english_intro,
            )
        )
    return results


@router.get("/clubs/categories", response_model=list[ClubCategorySummary])
def get_club_categories(db: Session = Depends(get_db)):
    ensure_clubs_seeded(db)
    clubs = db.query(ClubAndActivity).all()
    from collections import Counter
    counts = Counter(c.category or c.type for c in clubs)

    order = ["學術性", "康樂性", "體育性", "服務性", "聯誼性", "系學會"]
    res = []
    for cat in order:
        if cat in counts:
            res.append(ClubCategorySummary(category=cat, count=counts[cat]))
    for cat, cnt in counts.items():
        if cat not in order:
            res.append(ClubCategorySummary(category=cat, count=cnt))
    return res


@router.get("/clubs/{club_id}", response_model=ClubResponse)
def get_club_detail(club_id: str, db: Session = Depends(get_db)):
    ensure_clubs_seeded(db)
    club = db.query(ClubAndActivity).filter(ClubAndActivity.id == club_id).first()
    if not club:
        club = db.query(ClubAndActivity).filter(ClubAndActivity.name == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="找不到指定社團")

    return ClubResponse(
        id=club.id,
        name=club.name,
        english_name=club.english_name,
        type=club.type,
        category=club.category or club.type,
        day_of_week=club.day_of_week,
        period_slot=club.period_slot,
        location_id=club.location_id,
        location_name=club.location.name if club.location else (club.location_text or "活動場地"),
        location_text=club.location_text,
        website_url=club.website_url,
        image_url=club.image_url,
        prompt_context=club.prompt_context,
        full_intro=club.full_intro,
        english_intro=club.english_intro,
    )

