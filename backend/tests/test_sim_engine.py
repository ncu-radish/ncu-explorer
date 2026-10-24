import pytest

from app.schemas.llm import OnboardingParseSchema
from app.services.sim_engine import sim_engine


def test_build_weekly_schedule_default():
    """Test default schedule when no department or grade is given (default Freshman 1151)"""
    profile = OnboardingParseSchema()
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3

    # Ensure ONLY courses and clubs exist; dorm, free, and lunch must be removed
    assert all(s.type in ("course", "club") for s in schedule)
    assert not any(s.type in ("dorm", "free", "lunch") for s in schedule)
    assert all(s.start_time and s.end_time and s.display_time for s in schedule)

    unique_courses = {}
    for s in schedule:
        if s.type == "course" and s.title:
            cid = s.course_code or s.title
            unique_courses[cid] = s.credits or 0

    total_credits = sum(unique_courses.values())
    assert 16 <= total_credits <= 25, f"Default credits should be 16~25, got {total_credits}"


def test_build_weekly_schedule_freshman_im():
    """Test Freshman (大一) Information Management course scheduling"""
    profile = OnboardingParseSchema(
        department="資訊管理學系",
        grade=1,
        persona="學霸",
        club="熱音社",
    )
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3

    # Ensure ONLY courses and clubs exist
    assert all(s.type in ("course", "club") for s in schedule)
    assert not any(s.type in ("dorm", "free", "lunch") for s in schedule)
    assert all(s.start_time and s.end_time and s.display_time for s in schedule)

    # Calculate total unique credits
    unique_courses = {}
    for s in schedule:
        if s.type == "course" and s.title:
            cid = s.course_code or s.title
            unique_courses[cid] = s.credits or 0

    total_credits = sum(unique_courses.values())
    assert 16 <= total_credits <= 25, f"Credits for Freshman should be 16~25, got {total_credits}"


def test_build_weekly_schedule_sophomore():
    """Test Sophomore (大二) course scheduling with sports & electives"""
    profile = OnboardingParseSchema(
        department="資訊管理學系",
        grade=2,
        persona="活動咖",
        club="系學會",
    )
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3

    # Ensure ONLY courses and clubs exist
    assert all(s.type in ("course", "club") for s in schedule)
    assert not any(s.type in ("dorm", "free", "lunch") for s in schedule)
    assert all(s.start_time and s.end_time and s.display_time for s in schedule)

    unique_courses = {}
    for s in schedule:
        if s.type == "course" and s.title:
            cid = s.course_code or s.title
            unique_courses[cid] = s.credits or 0

    total_credits = sum(unique_courses.values())
    assert 16 <= total_credits <= 25, f"Credits for Sophomore should be 16~25, got {total_credits}"


def test_build_weekly_schedule_junior():
    """Test Junior (大三) course scheduling"""
    profile = OnboardingParseSchema(
        department="中國文學系",
        grade=3,
        persona="文青",
        club="吉他社",
    )
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3

    # Ensure ONLY courses and clubs exist
    assert all(s.type in ("course", "club") for s in schedule)
    assert not any(s.type in ("dorm", "free", "lunch") for s in schedule)
    assert all(s.start_time and s.end_time and s.display_time for s in schedule)

    unique_courses = {}
    for s in schedule:
        if s.type == "course" and s.title:
            cid = s.course_code or s.title
            unique_courses[cid] = s.credits or 0

    total_credits = sum(unique_courses.values())
    assert 16 <= total_credits <= 25, f"Credits for Junior should be 16~25, got {total_credits}"


def test_build_weekly_schedule_senior():
    """Test Senior (大四) course scheduling with low required credits"""
    profile = OnboardingParseSchema(
        department="資訊管理學系",
        grade=4,
        persona="佛系",
        club="吉他社",
    )
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3

    # Ensure ONLY courses and clubs exist
    assert all(s.type in ("course", "club") for s in schedule)
    assert not any(s.type in ("dorm", "free", "lunch") for s in schedule)
    assert all(s.start_time and s.end_time and s.display_time for s in schedule)

    unique_courses = {}
    for s in schedule:
        if s.type == "course" and s.title:
            cid = s.course_code or s.title
            unique_courses[cid] = s.credits or 0

    total_credits = sum(unique_courses.values())
    assert 9 <= total_credits <= 16, f"Credits for Senior should be 9~16, got {total_credits}"


@pytest.mark.anyio
async def test_parse_onboarding_double_major_and_minor():

    """Test text-based parsing of double major and minor from user input"""
    # 1. Double major test
    input_text = "我是資管系大二，雙主修資工系，想修演算法與計算機組織，晚上參加熱音社"
    parsed = await sim_engine.parse_onboarding(user_input=input_text, model_name="dummy_model")
    assert parsed.department == "資訊管理學系"
    assert parsed.grade == 2
    assert parsed.secondary_type == "雙主修"
    assert parsed.secondary_department == "資訊工程學系"

    # 2. Minor test
    input_minor = "我是企管系大三，輔系財金系，想深化財務分析與商業策略"
    parsed_minor = await sim_engine.parse_onboarding(user_input=input_minor, model_name="dummy_model")
    assert parsed_minor.department == "企業管理學系"
    assert parsed_minor.grade == 3
    assert parsed_minor.secondary_type == "輔系"
    assert parsed_minor.secondary_department == "財務金融學系"


def test_build_weekly_schedule_double_major():
    """Test double major (資管雙主修資工) scheduling: primary required -> secondary required -> electives"""
    profile = OnboardingParseSchema(
        department="資訊管理學系",
        grade=2,
        secondary_type="雙主修",
        secondary_department="資訊工程學系",
        clubs=["熱音社"],
    )
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3
    assert all(s.type in ("course", "club") for s in schedule)

    # 驗證包含「雙主修必修」之課程標籤
    sec_courses = [s for s in schedule if s.type == "course" and s.course_category == "雙主修必修"]
    assert len(sec_courses) > 0, "Schedule must contain courses from the secondary department"

    unique_courses = {}
    for s in schedule:
        if s.type == "course" and s.title:
            cid = s.course_code or s.title
            unique_courses[cid] = s.credits or 0

    total_credits = sum(unique_courses.values())
    assert 16 <= total_credits <= 25, f"Credits with double major should be 16~25, got {total_credits}"


def test_map_campus_location_codes_and_names():
    """驗證兩學期大樓代碼 (I1, E6, O, TR 等) 與中文全稱 (管理二館, 工程五館 等) 及系館回退機制皆正確對應 3D 建築 ID"""
    from app.services.sim_engine import map_campus_location

    # 1. 第一學期風格：大樓教室代碼
    bldg_id, name = map_campus_location("I1-105", "會計學", "資訊管理學系")
    assert bldg_id == "bldg_mgmt_2"
    assert "管理二館" in name

    bldg_id, name = map_campus_location("E6-A204", "資料結構", "資訊工程學系")
    assert bldg_id == "bldg_eng_5"
    assert "工程五館" in name

    bldg_id, name = map_campus_location("O-214", "通識課程", "通識教育中心")
    assert bldg_id == "bldg_general_edu"

    bldg_id, name = map_campus_location("TR-A001", "教研專題", "資訊管理學系")
    assert bldg_id == "bldg_tr"

    bldg_id, name = map_campus_location("YH-YH-1", "大一體育", "體育室")
    assert bldg_id == "bldg_yireng"

    bldg_id, name = map_campus_location("M-101", "微積分", "數學系")
    assert bldg_id == "bldg_hong_jing"

    # 2. 第二學期風格：中文館舍全名
    bldg_id, name = map_campus_location("管理二館-017", "資訊管理導論", "資訊管理學系")
    assert bldg_id == "bldg_mgmt_2"

    bldg_id, name = map_campus_location("工程五館", "計算機概論", "資訊工程學系")
    assert bldg_id == "bldg_eng_5"

    bldg_id, name = map_campus_location("綜合教學大樓", "國文經典閱讀", "通識教育中心")
    assert bldg_id == "bldg_general_edu"

    # 3. 無指定地點時，精準回退至所屬系館
    bldg_id, name = map_campus_location("", "演算法", "資訊工程學系")
    assert bldg_id == "bldg_eng_5"
    assert name == "工程五館"

    bldg_id, name = map_campus_location("", "程式設計", "資訊管理學系")
    assert bldg_id == "bldg_mgmt_2"
    assert name == "管理二館"

    bldg_id, name = map_campus_location("", "詞選", "中國文學系")
    assert bldg_id == "bldg_art_1"
    assert name == "文學一館"


def test_parse_onboarding_grade_retention(monkeypatch):
    """驗證部屬環境即使模型預設回傳大一 (1)，系統仍能強制保留使用者選擇的真實年級"""
    import asyncio

    # 模擬線上部屬環境中，LLM 固定回傳大一 (grade=1)
    async def mock_call_ollama(*args, **kwargs):
        return OnboardingParseSchema(
            department="資訊管理學系",
            grade=1,
            clubs=["系學會"],
            interest_query="程式設計"
        )

    monkeypatch.setattr("app.services.sim_engine.call_ollama_structured", mock_call_ollama)

    async def run_checks():
        # 1. 即使模型回傳大一，grade_hint=2 必須成功保留大二
        profile_2 = await sim_engine.parse_onboarding("我是資管大二學生", "gemma3:4b", dept_hint="資訊管理學系", grade_hint=2)
        assert profile_2.grade == 2
        assert profile_2.department == "資訊管理學系"

        # 2. grade_hint=3 必須成功保留大三
        profile_3 = await sim_engine.parse_onboarding("大三想認真做專題", "gemma3:4b", dept_hint="資訊工程學系", grade_hint=3)
        assert profile_3.grade == 3
        assert profile_3.department == "資訊工程學系"

        # 3. grade_hint=4 必須成功保留大四
        profile_4 = await sim_engine.parse_onboarding("老鳥大四", "gemma3:4b", dept_hint="企業管理學系", grade_hint=4)
        assert profile_4.grade == 4
        assert profile_4.department == "企業管理學系"

        # 4. 若未傳 grade_hint，由文字 '大二' 自動解析為 2
        profile_text = await sim_engine.parse_onboarding("我是資管大二學生", "gemma3:4b", dept_hint="資訊管理學系")
        assert profile_text.grade == 2

    asyncio.run(run_checks())




