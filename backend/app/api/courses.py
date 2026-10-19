from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.tables import Course, SystemConfig
from app.schemas.courses import (
    CourseItem,
    CourseSearchResponse,
    CourseAIQueryRequest,
    CourseAIQueryResponse,
    RoadmapResponse,
    CourseCompareRequest,
    CourseCompareResponse,
    DeptCompareRequest,
    DeptCompareResponse,
)
from app.services.rag_service import course_rag_service
from app.services.compare_service import compare_service
from app.core.llm_client import call_ollama_structured
from app.services.prompts import COURSE_RECOMMEND_PROMPT_TEMPLATE
from pydantic import BaseModel

router = APIRouter(prefix="/courses", tags=["Courses"])

def get_active_model(db: Session) -> str:
    config = db.query(SystemConfig).first()
    return config.active_llm_model if config else "gemma3:4b"

@router.get("/search", response_model=CourseSearchResponse)
def search_courses(
    dept: Optional[str] = Query(None, description="系所名稱"),
    grade: Optional[int] = Query(None, description="年級"),
    category: Optional[str] = Query(None, description="必選修類別 (required, elective, general)"),
    day: Optional[int] = Query(None, description="星期 (1~5)"),
    keyword: Optional[str] = Query(None, description="課名或大綱關鍵字"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if dept:
        query = query.filter(Course.department == dept)
    if grade is not None:
        query = query.filter(Course.grade == grade)
    if category:
        query = query.filter(Course.category == category)
    if day:
        query = query.filter(Course.day_of_week == day)
    if keyword:
        kw = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                Course.course_name.ilike(kw),
                Course.syllabus_summary.ilike(kw),
                Course.instructor.ilike(kw)
            )
        )

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    course_items = []
    for c in items:
        item = CourseItem.model_validate(c)
        if c.location:
            item.location_name = c.location.name
        course_items.append(item)

    return CourseSearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=course_items
    )

@router.post("/ai-query", response_model=CourseAIQueryResponse)
async def ai_query_courses(req: CourseAIQueryRequest, db: Session = Depends(get_db)):
    active_model = get_active_model(db)

    # 1. 混合檢索 Top 6 課程
    matched_payloads = course_rag_service.hybrid_search_courses(
        query=req.query,
        limit=6,
        dept_filter=req.dept_filter,
        grade_filter=req.grade_filter
    )

    course_ids = [p["course_id"] for p in matched_payloads]
    courses_db = db.query(Course).filter(Course.id.in_(course_ids)).all()
    # 按照檢索分數排序
    order_map = {cid: idx for idx, cid in enumerate(course_ids)}
    courses_db.sort(key=lambda c: order_map.get(c.id, 999))

    course_items = []
    summary_bullets = []
    for c in courses_db:
        item = CourseItem.model_validate(c)
        if c.location:
            item.location_name = c.location.name
        course_items.append(item)
        summary_bullets.append(f"- 《{c.course_name}》（{c.department}）：{c.syllabus_summary}")

    # 2. 呼叫 LLM 以選課顧問口吻撰寫導讀
    prompt = COURSE_RECOMMEND_PROMPT_TEMPLATE.format(
        user_query=req.query,
        retrieved_courses_summary="\n".join(summary_bullets)
    )

    class AdviceSchema(BaseModel):
        advice: str

    fallback_advice = (
        f"針對你提到的「{req.query}」，學長姐特別推薦這些精選課程！"
        "從扎實基礎理論到實際專案實作皆涵蓋其中，能有效幫助你建立完整技能樹與實務視野。"
    )

    try:
        res = await call_ollama_structured(
            user_prompt=prompt,
            response_schema=AdviceSchema,
            model_name=active_model,
            fallback_instance=AdviceSchema(advice=fallback_advice),
            timeout=25.0
        )
        consultant_advice = res.advice
    except Exception:
        consultant_advice = fallback_advice

    return CourseAIQueryResponse(
        consultant_advice=consultant_advice,
        recommended_courses=course_items
    )

@router.get("/roadmap/{dept}", response_model=RoadmapResponse)
async def get_department_roadmap(dept: str, db: Session = Depends(get_db)):
    active_model = get_active_model(db)
    courses = db.query(Course).filter(Course.department == dept).order_by(Course.grade, Course.semester_term).all()

    # 8 個學期分組
    semesters: dict[str, List[CourseItem]] = {
        "大一上": [], "大一下": [],
        "大二上": [], "大二下": [],
        "大三上": [], "大三下": [],
        "大四上": [], "大四下": []
    }
    courses_by_year: dict[str, List[Course]] = {
        "大一": [], "大二": [], "大三": [], "大四": []
    }

    grade_map = {1: "大一", 2: "大二", 3: "大三", 4: "大四"}
    term_map = {1: "上", 2: "下"}

    for c in courses:
        g_label = grade_map.get(c.grade, "大一")
        t_label = term_map.get(c.semester_term, "上")
        sem_key = f"{g_label}{t_label}"
        item = CourseItem.model_validate(c)
        if c.location:
            item.location_name = c.location.name

        if sem_key in semesters:
            semesters[sem_key].append(item)
        if g_label in courses_by_year:
            courses_by_year[g_label].append(c)

    # 生成 AI 四年學習脈絡
    ai_analysis = await compare_service.generate_roadmap_analysis(
        dept_name=dept,
        courses_by_year=courses_by_year,
        active_model=active_model
    )

    return RoadmapResponse(
        department=dept,
        semesters=semesters,
        ai_analysis=ai_analysis
    )

@router.post("/compare", response_model=CourseCompareResponse)
async def compare_courses_endpoint(req: CourseCompareRequest, db: Session = Depends(get_db)):
    if len(req.course_ids) < 2 or len(req.course_ids) > 3:
        raise HTTPException(status_code=400, detail="請選擇 2 到 3 門課程進行比較")

    active_model = get_active_model(db)
    courses = db.query(Course).filter(Course.id.in_(req.course_ids)).all()
    if len(courses) < 2:
        raise HTTPException(status_code=404, detail="找不到足夠的課程資料進行比較")

    comparison = await compare_service.compare_courses(
        db=db,
        course_ids=req.course_ids,
        active_model=active_model
    )

    course_items = []
    for c in courses:
        item = CourseItem.model_validate(c)
        if c.location:
            item.location_name = c.location.name
        course_items.append(item)

    return CourseCompareResponse(
        comparison=comparison,
        courses=course_items
    )

@router.post("/compare-depts", response_model=DeptCompareResponse)
async def compare_depts_endpoint(req: DeptCompareRequest, db: Session = Depends(get_db)):
    if len(req.dept_names) != 2:
        raise HTTPException(status_code=400, detail="請選擇剛好 2 個系所進行深度比較")

    active_model = get_active_model(db)
    dept_a, dept_b = req.dept_names[0], req.dept_names[1]

    courses_a = db.query(Course).filter(Course.department == dept_a).limit(6).all()
    courses_b = db.query(Course).filter(Course.department == dept_b).limit(6).all()

    comparison = await compare_service.compare_departments(
        db=db,
        dept_names=req.dept_names,
        active_model=active_model
    )

    return DeptCompareResponse(
        comparison=comparison,
        dept_a_name=dept_a,
        dept_b_name=dept_b,
        dept_a_sample_courses=[c.course_name for c in courses_a],
        dept_b_sample_courses=[c.course_name for c in courses_b]
    )
