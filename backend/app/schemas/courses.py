from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.llm import CourseCompareSchema, DeptCompareSchema, RoadmapSummarySchema

class CourseItem(BaseModel):
    id: str
    semester: str
    department: str
    grade: int
    semester_term: int
    course_name: str
    instructor: str
    category: str
    credits: int
    day_of_week: int
    period_slot: str
    raw_schedule: str
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    syllabus_summary: str
    full_syllabus: Optional[str] = None
    is_synced_vec: bool

    class Config:
        from_attributes = True

class CourseSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[CourseItem]

class CourseAIQueryRequest(BaseModel):
    query: str
    grade_filter: Optional[int] = None
    dept_filter: Optional[str] = None

class CourseAIQueryResponse(BaseModel):
    consultant_advice: str
    recommended_courses: List[CourseItem]

class RoadmapResponse(BaseModel):
    department: str
    semesters: Dict[str, List[CourseItem]]
    ai_analysis: RoadmapSummarySchema

class CourseCompareRequest(BaseModel):
    course_ids: List[str]

class CourseCompareResponse(BaseModel):
    comparison: CourseCompareSchema
    courses: List[CourseItem]

class DeptCompareRequest(BaseModel):
    dept_names: List[str]

class DeptCompareResponse(BaseModel):
    comparison: DeptCompareSchema
    dept_a_name: str
    dept_b_name: str
    dept_a_sample_courses: List[str]
    dept_b_sample_courses: List[str]
