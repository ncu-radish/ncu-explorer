from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tables import SystemConfig
from app.schemas.courses import (
    CourseAIQueryRequest,
    CourseAIQueryResponse,
    CourseCompareRequest,
    CourseCompareResponse,
    CourseExactSearchResponse,
    CourseItem,
    CourseMetaResponse,
    DepartmentRecommendRequest,
    DepartmentRecommendResponse,
    DeptCompareRequest,
    DeptCompareResponse,
    RoadmapResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
)
from app.services.compare_service import compare_service
from app.services.course_db import course_db_service
from app.services.course_vector_service import course_vector_service

router = APIRouter(prefix="/courses", tags=["Courses"])


def get_active_model(db: Session) -> str:
    config = db.query(SystemConfig).first()
    return config.active_llm_model if config else "gemma3:4b"


@router.get("/meta", response_model=CourseMetaResponse)
def get_courses_metadata():
    """取得全校課程之中繼資訊（學期列表、系所清單、學制與總課數）"""
    try:
        meta = course_db_service.get_meta()
        return CourseMetaResponse(**meta)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"讀取課程中繼資料失敗: {str(e)}") from e


@router.get("/search", response_model=CourseExactSearchResponse)
def search_courses_endpoint(
    semester: str | None = Query(None, description="開課學期 (1151 或 1142)"),
    dept: str | None = Query(None, description="開課系所名稱"),
    degree: str | None = Query(None, description="學制 (學士班, 碩士班等)"),
    grade: int | None = Query(None, description="年級 (1~4)"),
    credits: float | None = Query(None, description="學分數"),
    day: int | None = Query(None, description="星期 (1~7)"),
    keyword: str | None = Query(None, description="課程名稱、課號、教師或內容關鍵字"),
    required_or_elective: str | None = Query(None, description="修別 (必修 / 選修)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
):
    """精準查詢課程：依關鍵字與多維度欄位進行全校課程檢索"""
    try:
        result = course_db_service.search_courses(
            semester=semester,
            department=dept,
            degree=degree,
            grade=grade,
            credits=credits,
            day=day,
            keyword=keyword,
            required_or_elective=required_or_elective,
            page=page,
            page_size=page_size,
        )
        return CourseExactSearchResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜尋課程時發生錯誤: {str(e)}") from e


@router.get("/detail/{semester}/{serial_no}")
def get_course_detail_endpoint(semester: str, serial_no: str):
    """取得單一課程完整詳細資訊（含上課教室、核心能力指標與分發限制順位）"""
    course = course_db_service.get_course_detail(semester=semester, serial_no=serial_no)
    if not course:
        raise HTTPException(status_code=404, detail="找不到指定課程資料")
    return course


@router.get("/by-code/{course_code}")
def get_course_by_code_endpoint(course_code: str):
    """依據課號 (例如 IM4048, EE1003) 取得最新課程之課綱、教授、教室與詳細內容"""
    course = course_db_service.get_course_by_code(course_code=course_code)
    if not course:
        raise HTTPException(status_code=404, detail="找不到指定課號之課程資料")
    return course


@router.post("/by-codes")
def get_courses_by_codes_endpoint(codes: list[str]):
    """批次依據多組課號取得最新課程之課綱映射"""
    return course_db_service.get_courses_by_codes(course_codes=codes)


@router.post("/semantic-search", response_model=SemanticSearchResponse)
def semantic_search_courses(req: SemanticSearchRequest):
    """
    模糊查詢：透過 ChromaDB 向量資料庫進行自然語言語意檢索，
    回傳與使用者意圖相關度最高的課程清單與相符度百分比。
    """
    try:
        matches = course_vector_service.semantic_search(
            query=req.query,
            semester=req.semester,
            department=req.department,
            degree=req.degree,
            top_k=req.top_k,
        )
        return SemanticSearchResponse(
            query=req.query,
            total=len(matches),
            items=matches,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"向量資料庫語意檢索失敗: {str(e)}") from e


@router.post("/department-recommend", response_model=DepartmentRecommendResponse)
async def recommend_department_courses(
    req: DepartmentRecommendRequest,
    db: Session = Depends(get_db),
):
    """
    學系推薦：輸入有興趣的領域或是特定課程，
    查詢後回覆契合度最高的學系排名與代表核心課程，並給予選課指引。
    """
    try:
        rec_data = await course_vector_service.recommend_departments(
            interest_query=req.interest_query,
            semester=req.semester,
            top_departments_count=req.top_departments_count,
            courses_per_dept=req.courses_per_dept,
        )
        return DepartmentRecommendResponse(**rec_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"學系推薦計算失敗: {str(e)}") from e


# -------------------------------------------------------------------------
# Legacy Simulator & Comparison Endpoints
# -------------------------------------------------------------------------
@router.post("/ai-query", response_model=CourseAIQueryResponse)
async def ai_query_courses_legacy(req: CourseAIQueryRequest, db: Session = Depends(get_db)):
    """支援舊版模擬器與簡易探索之問答端點"""
    # 優先使用向量庫檢索
    try:
        matched = course_vector_service.semantic_search(query=req.query, department=req.dept_filter, top_k=6)
        course_items = []
        summary_bullets = []
        for m in matched:
            c_name = m.get("course_name_zh", "")
            dept = m.get("department", "")
            preview = m.get("preview", "")
            course_items.append(CourseItem(
                id=m["id"],
                semester=m["semester"],
                department=dept,
                grade=1,
                semester_term=1,
                course_name=c_name,
                instructor=m.get("teacher", ""),
                category="elective",
                credits=int(m.get("credits", 3)),
                day_of_week=1,
                period_slot="morning",
                raw_schedule="未定",
                syllabus_summary=preview,
                is_synced_vec=True,
            ))
            summary_bullets.append(f"- 《{c_name}》（{dept}）：{preview}")

        consultant_advice = (
            f"針對你提到的「{req.query}」，推薦這些精選課程！"
            "從扎實基礎理論到實際專案實作皆涵蓋其中，能有效幫助你建立完整技能樹與實務視野。"
        )
        return CourseAIQueryResponse(
            consultant_advice=consultant_advice,
            recommended_courses=course_items,
        )
    except Exception:
        return CourseAIQueryResponse(
            consultant_advice="無法取得推薦課程",
            recommended_courses=[],
        )


@router.get("/roadmap/{dept}", response_model=RoadmapResponse)
async def get_department_roadmap(dept: str, db: Session = Depends(get_db)):
    active_model = get_active_model(db)
    # 從 SQLite courses 撈取指定系所 1151 (上) 與 1142 (下) 之大一至大四必修學習地圖
    raw_semesters = course_db_service.get_department_roadmap(dept)

    semesters: dict[str, list[CourseItem]] = {}
    courses_by_year_for_ai: dict[str, list[Any]] = {
        "大一": [], "大二": [], "大三": [], "大四": []
    }

    for sem_key, items in raw_semesters.items():
        course_items = [CourseItem(**item) for item in items]
        semesters[sem_key] = course_items
        year_key = sem_key[:2]
        if year_key in courses_by_year_for_ai:
            courses_by_year_for_ai[year_key].extend(course_items)

    # 生成 AI 四年學習脈絡
    ai_analysis = await compare_service.generate_roadmap_analysis(
        dept_name=dept,
        courses_by_year=courses_by_year_for_ai,
        active_model=active_model,
    )

    return RoadmapResponse(
        department=dept,
        semesters=semesters,
        ai_analysis=ai_analysis,
    )


@router.post("/compare", response_model=CourseCompareResponse)
async def compare_courses_endpoint(req: CourseCompareRequest, db: Session = Depends(get_db)):
    if len(req.course_ids) < 2 or len(req.course_ids) > 3:
        raise HTTPException(status_code=400, detail="請選擇 2 到 3 門課程進行比較")

    active_model = get_active_model(db)
    comparison = await compare_service.compare_courses(
        db=db,
        course_ids=req.course_ids,
        active_model=active_model,
    )

    items = []
    for cid in req.course_ids:
        parts = cid.split("_")
        sem = parts[0] if len(parts) >= 2 else "1151"
        sno = parts[1] if len(parts) >= 2 else cid
        det = course_db_service.get_course_detail(sem, sno)
        if det:
            items.append(CourseItem(
                id=cid,
                semester=det["semester"],
                department=det["department"],
                grade=1,
                semester_term=1,
                course_name=det["course_name_zh"],
                instructor=det["teacher"],
                category="elective",
                credits=int(det.get("credits") or 3),
                day_of_week=1,
                period_slot="morning",
                raw_schedule="排定",
                syllabus_summary=det.get("objectives") or "",
                is_synced_vec=True,
            ))

    return CourseCompareResponse(
        comparison=comparison,
        courses=items,
    )


@router.post("/compare-depts", response_model=DeptCompareResponse)
async def compare_depts_endpoint(req: DeptCompareRequest, db: Session = Depends(get_db)):
    if len(req.dept_names) != 2:
        raise HTTPException(status_code=400, detail="請選擇剛好 2 個系所進行深度比較")

    active_model = get_active_model(db)
    dept_a, dept_b = req.dept_names[0], req.dept_names[1]

    courses_a = course_db_service.search_courses(department=dept_a, page_size=6).get("items", [])
    courses_b = course_db_service.search_courses(department=dept_b, page_size=6).get("items", [])

    comparison = await compare_service.compare_departments(
        db=db,
        dept_names=req.dept_names,
        active_model=active_model,
    )

    return DeptCompareResponse(
        comparison=comparison,
        dept_a_name=dept_a,
        dept_b_name=dept_b,
        dept_a_sample_courses=[c["course_name_zh"] for c in courses_a],
        dept_b_sample_courses=[c["course_name_zh"] for c in courses_b],
    )
