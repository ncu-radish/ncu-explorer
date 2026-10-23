from pydantic import BaseModel, Field


class OptionItem(BaseModel):
    option_key: str = Field(description="固定對應輸入的 A, B 或 C")
    display_text: str = Field(description="根據選項提示潤飾出的生動行動文字，限 25 字以內")

class TurnGenerationSchema(BaseModel):
    narrative: str = Field(description="100至150字的第二人稱（你）校園情境描述，需自然融入當前時段、地點特色、課程與突發狀況")
    options: list[OptionItem] = Field(description="固定包含 A, B, C 三個選項")

class OnboardingParseSchema(BaseModel):
    department: str = Field(default="資訊管理學系", description="就讀系所中文全名，如：資訊管理學系、資訊工程學系")
    grade: int = Field(default=1, description="年級，預設為大一（1）")
    semester_term: int = Field(default=1, description="學期（1代表上學期，2代表下學期）")
    clubs: list[str] = Field(default_factory=list, description="想參加的社團或系學會名稱清單")
    interest_query: str = Field(default="", description="使用者的其他修課或領域興趣關鍵字，如：人工智慧、網頁設計、投資理財")

class CourseCompareSchema(BaseModel):
    target_names: list[str] = Field(description="參與比較的課程名稱列表")
    core_difference: str = Field(description="核心教學目標與技術範疇差異分析")
    theory_vs_practice: str = Field(description="理論深度與程式實作/專案比重評估")
    prerequisites_difficulty: str = Field(description="先修門檻與修課學習難度評估")
    suitable_for: str = Field(description="適合什麼樣背景、志向或升學就業方向的學生選修")

class DeptCompareSchema(BaseModel):
    dept_names: list[str] = Field(description="參與比較的系所名稱列表")
    core_difference: str = Field(description="兩大學系的教育定位、核心專業思維差異")
    curriculum_focus: str = Field(description="大一至大四必修與核心選修的修課重心對比")
    career_paths: str = Field(description="畢業後常見研究所出路與就業職涯航道")
    suitable_for: str = Field(description="適合具備何種特質與興趣的高中生或轉系生")

class RoadmapSummarySchema(BaseModel):
    four_year_overview: str = Field(description="該系所大一至大四四年完整能力養成脈絡的精闢分析（約150字）")
    year_highlights: dict[str, str] = Field(description="各年級學習重心與代表性課程關鍵特色")
