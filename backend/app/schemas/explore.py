from typing import Any

from pydantic import BaseModel


class LocationResponse(BaseModel):
    id: str
    name: str
    category: str
    three_mesh_name: str | None = None
    camera_pos: dict[str, Any] | None = None
    short_desc: str
    full_content: str
    image_url: str | None = None
    course_count: int = 0
    activity_count: int = 0

    class Config:
        from_attributes = True

class LocationDetailResponse(LocationResponse):
    courses: list[dict[str, Any]] = []
    activities: list[dict[str, Any]] = []
    life_infos: list[dict[str, Any]] = []

class CampusLifeItem(BaseModel):
    id: int
    info_type: str
    title: str
    location_id: str | None = None
    location_name: str | None = None
    tags: list[str]
    game_snippet: str
    content_html: str

    class Config:
        from_attributes = True


class BuildingResponse(BaseModel):
    id: str
    name_zh: str
    name_en: str | None = None
    category: str | None = None
    classroom_code: str | None = None
    departments: list[str] | None = []
    alias: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True


class ClubResponse(BaseModel):
    id: str
    name: str
    english_name: str | None = None
    type: str
    category: str | None = None
    day_of_week: int = 2
    period_slot: str = "evening"
    location_id: str | None = None
    location_name: str | None = None
    location_text: str | None = None
    website_url: str | None = None
    image_url: str | None = None
    prompt_context: str | None = None
    full_intro: str
    english_intro: str | None = None

    class Config:
        from_attributes = True


class ClubCategorySummary(BaseModel):
    category: str
    count: int

