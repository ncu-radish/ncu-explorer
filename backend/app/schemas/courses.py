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
    location_id: str | None = None
    location_name: str | None = None
    syllabus_summary: str
    full_syllabus: str | None = None
    is_synced_vec: bool

    class Config:
        from_attributes = True

class CourseSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[CourseItem]

class CourseAIQueryRequest(BaseModel):
    query: str
    grade_filter: int | None = None
    dept_filter: str | None = None

class CourseAIQueryResponse(BaseModel):
    consultant_advice: str
    recommended_courses: list[CourseItem]

class RoadmapResponse(BaseModel):
    department: str
    semesters: dict[str, list[CourseItem]]
    ai_analysis: RoadmapSummarySchema

class CourseCompareRequest(BaseModel):
    course_ids: list[str]

class CourseCompareResponse(BaseModel):
    comparison: CourseCompareSchema
    courses: list[CourseItem]

class DeptCompareRequest(BaseModel):
    dept_names: list[str]

class DeptCompareResponse(BaseModel):
    comparison: DeptCompareSchema
    dept_a_name: str
    dept_b_name: str
    dept_a_sample_courses: list[str]
    dept_b_sample_courses: list[str]
