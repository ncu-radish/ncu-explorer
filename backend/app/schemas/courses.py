from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from app.schemas.llm import CourseCompareSchema, DeptCompareSchema, RoadmapSummarySchema


class ScheduleItem(BaseModel):
    time: str
    location: str


class CoreSkillItem(BaseModel):
    ability: str
    strength: str
    assessment_method: Optional[str] = ""


class DistributionConditionItem(BaseModel):
    priority: int
    condition: str


class FullCourseItem(BaseModel):
    id: str
    semester: str
    serial_no: str
    course_code: str
    department: str
    teacher: str
    course_name_zh: str
    course_name_en: str
    degree: str
    credits: float
    objectives: Optional[str] = ""
    content: Optional[str] = ""
    textbooks: Optional[str] = ""
    fields: Optional[str] = ""
    schedules: List[ScheduleItem] = []
    core_skills: List[CoreSkillItem] = []
    distribution_conditions: List[DistributionConditionItem] = []


class CourseMetaSemester(BaseModel):
    id: str
    name: str
    short: str
    count: int


class CourseMetaResponse(BaseModel):
    departments: List[str]
    semesters: List[CourseMetaSemester]
    degrees: List[str]
    total_courses: int


class CourseExactSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Dict[str, Any]]


class SemanticSearchRequest(BaseModel):
    query: str
    semester: Optional[str] = None
    department: Optional[str] = None
    degree: Optional[str] = None
    top_k: int = 20


class SemanticSearchResponse(BaseModel):
    query: str
    total: int
    items: List[Dict[str, Any]]


class DepartmentRecommendRequest(BaseModel):
    interest_query: str
    semester: Optional[str] = None
    top_departments_count: int = 5
    courses_per_dept: int = 4


class RecommendedDepartmentItem(BaseModel):
    department: str
    match_score: float
    avg_score: float
    course_count: int
    featured_courses: List[Dict[str, Any]]


class DepartmentRecommendResponse(BaseModel):
    query: str
    departments: List[RecommendedDepartmentItem]
    top_courses: List[Dict[str, Any]]
    consultant_advice: str


# Vector Universe Schemas (for Admin)
class VectorUniverseResponse(BaseModel):
    total: int
    algorithm: str
    metric: str
    n_neighbors: int = 15
    min_dist: float = 0.1
    points: List[Dict[str, Any]]


class VectorProjectRequest(BaseModel):
    query: str
    top_k: int = 5
    semester: Optional[str] = None
    department: Optional[str] = None


class VectorProjectResponse(BaseModel):
    query: str
    coord: List[float]
    nearest_courses: List[Dict[str, Any]]


# Legacy CourseItem for simulator backward compatibility
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
