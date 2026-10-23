from typing import Any

from pydantic import BaseModel

from app.schemas.llm import CourseCompareSchema, DeptCompareSchema, RoadmapSummarySchema


class ScheduleItem(BaseModel):
    time: str
    location: str


class CoreSkillItem(BaseModel):
    ability: str
    strength: str
    assessment_method: str | None = ""


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
    required_or_elective: str | None = ""
    objectives: str | None = ""
    content: str | None = ""
    textbooks: str | None = ""
    fields: str | None = ""
    schedules: list[ScheduleItem] = []
    core_skills: list[CoreSkillItem] = []
    distribution_conditions: list[DistributionConditionItem] = []


class CourseMetaSemester(BaseModel):
    id: str
    name: str
    short: str
    count: int


class CourseMetaResponse(BaseModel):
    departments: list[str]
    semesters: list[CourseMetaSemester]
    degrees: list[str]
    total_courses: int


class CourseExactSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[dict[str, Any]]


class SemanticSearchRequest(BaseModel):
    query: str
    semester: str | None = None
    department: str | None = None
    degree: str | None = None
    top_k: int = 20


class SemanticSearchResponse(BaseModel):
    query: str
    total: int
    items: list[dict[str, Any]]


class DepartmentRecommendRequest(BaseModel):
    interest_query: str
    semester: str | None = None
    top_departments_count: int = 5
    courses_per_dept: int = 4


class RecommendedDepartmentItem(BaseModel):
    department: str
    match_score: float
    avg_score: float
    course_count: int
    featured_courses: list[dict[str, Any]]


class DepartmentRecommendResponse(BaseModel):
    query: str
    departments: list[RecommendedDepartmentItem]
    top_courses: list[dict[str, Any]]
    consultant_advice: str


# Vector Universe Schemas (for Admin)
class VectorUniverseResponse(BaseModel):
    total: int
    algorithm: str
    metric: str
    n_neighbors: int = 15
    min_dist: float = 0.1
    points: list[dict[str, Any]]


class VectorProjectRequest(BaseModel):
    query: str
    top_k: int = 5
    semester: str | None = None
    department: str | None = None


class VectorProjectResponse(BaseModel):
    query: str
    coord: list[float]
    nearest_courses: list[dict[str, Any]]


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
