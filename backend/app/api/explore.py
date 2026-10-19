from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.tables import CampusLocation, CampusLifeInfo, ClubAndActivity, Course
from app.schemas.explore import LocationResponse, LocationDetailResponse, CampusLifeItem

router = APIRouter(prefix="/explore", tags=["Explore & 3D Map"])

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
