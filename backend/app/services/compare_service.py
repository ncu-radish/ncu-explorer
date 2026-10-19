import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.tables import Course
from app.schemas.llm import CourseCompareSchema, DeptCompareSchema, RoadmapSummarySchema
from app.core.llm_client import call_ollama_structured
from app.services.prompts import (
    COURSE_COMPARE_PROMPT_TEMPLATE,
    DEPT_COMPARE_PROMPT_TEMPLATE,
    ROADMAP_SUMMARY_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)

class CompareService:
    async def compare_courses(
        self,
        db: Session,
        course_ids: List[str],
        active_model: str
    ) -> CourseCompareSchema:
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
        course_texts = []
        for c in courses:
            course_texts.append(
                f"【課程】：{c.course_name}（{c.department}，{c.grade}年級{c.category}，{c.credits}學分）\n"
                f"【大綱摘要】：{c.syllabus_summary}"
            )

        prompt = COURSE_COMPARE_PROMPT_TEMPLATE.format(
            courses_text="\n\n".join(course_texts)
        )

        names = [c.course_name for c in courses]
        fallback = CourseCompareSchema(
            target_names=names,
            core_difference="本兩門課程分別著重於不同的理論抽象層次與商務/工程應用場景，涵蓋多元的核心技術脈絡。",
            theory_vs_practice="課程均配有課堂講授與上機作業，其中一門偏重演算法數學證明，另一門則重視實務專案架構實作。",
            prerequisites_difficulty="建議具備基礎程式語言設計與基礎資料結構底子，修課難度中等偏扎實。",
            suitable_for="適合希望深入資訊架構或想在該領域建立扎實專業基礎的同學修習。"
        )

        try:
            return await call_ollama_structured(
                user_prompt=prompt,
                response_schema=CourseCompareSchema,
                model_name=active_model,
                fallback_instance=fallback,
                timeout=30.0
            )
        except Exception as e:
            logger.warning(f"Course compare failed, using fallback: {e}")
            return fallback

    async def compare_departments(
        self,
        db: Session,
        dept_names: List[str],
        active_model: str
    ) -> DeptCompareSchema:
        dept_a = dept_names[0] if len(dept_names) > 0 else "資訊管理學系"
        dept_b = dept_names[1] if len(dept_names) > 1 else "資訊工程學系"

        courses_a = db.query(Course).filter(Course.department == dept_a).all()
        courses_b = db.query(Course).filter(Course.department == dept_b).all()

        list_a = "、".join([c.course_name for c in courses_a[:8]])
        list_b = "、".join([c.course_name for c in courses_b[:8]])

        prompt = DEPT_COMPARE_PROMPT_TEMPLATE.format(
            dept_a_name=dept_a,
            dept_a_courses=list_a or "無課程資料",
            dept_b_name=dept_b,
            dept_b_courses=list_b or "無課程資料"
        )

        fallback = DeptCompareSchema(
            dept_names=[dept_a, dept_b],
            core_difference=f"{dept_a} 融合管理思維與資訊科技整合應用；{dept_b} 則著重底層硬體系統、作業系統與演算法實作。",
            curriculum_focus=f"{dept_a} 大一至大四涵蓋管理學、資料庫、網頁全端與商業人工智慧；{dept_b} 則深耕計算機架構、離散數學與深度學習演算法。",
            career_paths=f"{dept_a} 畢業生常見出路為全端軟體工程師、產品經理 (PM)、資料分析師；{dept_b} 畢業生多為韌體工程師、AI 研究員與演算法開發者。",
            suitable_for="喜歡跨領域商業與軟體整合者推薦資管；熱愛鑽研系統底層架構與數學演算法者推薦資工。"
        )

        try:
            return await call_ollama_structured(
                user_prompt=prompt,
                response_schema=DeptCompareSchema,
                model_name=active_model,
                fallback_instance=fallback,
                timeout=30.0
            )
        except Exception as e:
            logger.warning(f"Dept compare failed, using fallback: {e}")
            return fallback

    async def generate_roadmap_analysis(
        self,
        dept_name: str,
        courses_by_year: Dict[str, List[Course]],
        active_model: str
    ) -> RoadmapSummarySchema:
        summary_lines = []
        for year_label, courses in courses_by_year.items():
            names = "、".join([c.course_name for c in courses])
            summary_lines.append(f"{year_label}：{names}")

        prompt = ROADMAP_SUMMARY_PROMPT_TEMPLATE.format(
            dept_name=dept_name,
            courses_by_year_text="\n".join(summary_lines)
        )

        fallback = RoadmapSummarySchema(
            four_year_overview=f"中央大學{dept_name}四年學習脈絡循序漸進：大一扎根基礎程式與核心學科，大二打磨核心資料結構與系統，大三整合團隊實作與前瞻領域選修，大四深化專題研發與產學對接。",
            year_highlights={
                "大一": "奠定數學邏輯與基礎程式設計核心素養。",
                "大二": "深入資料結構、資料庫系統等核心必修。",
                "大三": "跨足人工智慧、全端網頁與大型系統實務專案。",
                "大四": "畢業專題成果發表、企業實習與研究所深造準備。"
            }
        )

        try:
            return await call_ollama_structured(
                user_prompt=prompt,
                response_schema=RoadmapSummarySchema,
                model_name=active_model,
                fallback_instance=fallback,
                timeout=30.0
            )
        except Exception as e:
            logger.warning(f"Roadmap analysis failed, using fallback: {e}")
            return fallback

compare_service = CompareService()
