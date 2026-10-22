from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session
from pathlib import Path
import json
from app.core.database import get_db, engine, Base
from app.models.tables import CampusLocation, CampusLifeInfo, ClubAndActivity, Course, Building
from app.schemas.explore import LocationResponse, LocationDetailResponse, CampusLifeItem, BuildingResponse

router = APIRouter(prefix="/explore", tags=["Explore & 3D Map"])

def ensure_buildings_seeded(db: Session):
    Base.metadata.create_all(bind=engine)
    count = db.query(Building).count()
    if count == 0:
        buildings_file = Path(__file__).resolve().parent.parent.parent / "data" / "buildings.json"
        if buildings_file.exists():
            with open(buildings_file, "r", encoding="utf-8") as f:
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


@router.get("/buildings", response_model=List[BuildingResponse])
def get_buildings(
    q: Optional[str] = Query(None, description="搜尋關鍵字 (id, name_zh, name_en, classroom_code, alias, departments)"),
    category: Optional[str] = Query(None, description="建築物分類篩選"),
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


@router.get("/locations", response_model=List[LocationResponse])
def get_all_locations(
    category: Optional[str] = Query(None, description="場域類別"),
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
            "content_md": i.content_md,
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

@router.get("/life-info", response_model=List[CampusLifeItem])
def get_campus_life_info(
    info_type: Optional[str] = Query(None, description="類別：food, dorm_detail, transport"),
    tag: Optional[str] = Query(None, description="標籤篩選"),
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

@router.get("/clubs")
def get_all_clubs(
    club_type: Optional[str] = Query(None, description="社團類型"),
    db: Session = Depends(get_db)
):
    query = db.query(ClubAndActivity)
    if club_type:
        query = query.filter(ClubAndActivity.type == club_type)
    clubs = query.all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "type": c.type,
            "day_of_week": c.day_of_week,
            "period_slot": c.period_slot,
            "location_id": c.location_id,
            "location_name": c.location.name if c.location else None,
            "prompt_context": c.prompt_context,
            "full_intro": c.full_intro,
        }
        for c in clubs
    ]
