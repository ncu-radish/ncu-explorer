from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class LocationResponse(BaseModel):
    id: str
    name: str
    category: str
    three_mesh_name: Optional[str] = None
    camera_pos: Optional[Dict[str, Any]] = None
    short_desc: str
    full_content: str
    image_url: Optional[str] = None
    course_count: int = 0
    activity_count: int = 0

    class Config:
        from_attributes = True

class LocationDetailResponse(LocationResponse):
    courses: List[Dict[str, Any]] = []
    activities: List[Dict[str, Any]] = []
    life_infos: List[Dict[str, Any]] = []

class CampusLifeItem(BaseModel):
    id: int
    info_type: str
    title: str
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    tags: List[str]
    game_snippet: str
    content_md: str

    class Config:
        from_attributes = True
