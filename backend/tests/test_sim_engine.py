import pytest

from app.schemas.llm import OnboardingParseSchema
from app.services.sim_engine import sim_engine


def test_build_weekly_schedule_default():
    """Test default schedule when no department or grade is given (default Freshman 1151)"""
    profile = OnboardingParseSchema()
    schedule = sim_engine.build_weekly_schedule(None, profile)
    assert len(schedule) >= 3

    # Ensure ONLY valid courses, clubs, and checkpoints exist; dorm, free, and lunch must be removed
    valid_types = ("course", "club", "lunch_prompt", "leisure_prompt", "day_end")
    assert all(s.type in valid_types for s in schedule)
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

    valid_types = ("course", "club", "lunch_prompt", "leisure_prompt", "day_end")
    assert all(s.type in valid_types for s in schedule)
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

    valid_types = ("course", "club", "lunch_prompt", "leisure_prompt", "day_end")
    assert all(s.type in valid_types for s in schedule)
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

    valid_types = ("course", "club", "lunch_prompt", "leisure_prompt", "day_end")
    assert all(s.type in valid_types for s in schedule)
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

    valid_types = ("course", "club", "lunch_prompt", "leisure_prompt", "day_end")
    assert all(s.type in valid_types for s in schedule)
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
    valid_types = ("course", "club", "lunch_prompt", "leisure_prompt", "day_end")
    assert all(s.type in valid_types for s in schedule)

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


def test_club_schedule_classification_and_matching():
    """驗證社團模糊比對、天數 (1~3天) 與夜間時段 (18:00~22:00) 正確排程"""
    all_clubs = sim_engine.load_all_clubs()
    assert len(all_clubs) >= 100

    # 1. 測試教學性/讀書會社團 (1天，18:30~20:30)
    matched_acad = sim_engine.match_nearest_club("中央資安讀書會", all_clubs)
    assert "網安讀書會" in matched_acad["name"] or "資安" in matched_acad["name"]
    prof_acad = sim_engine.classify_club_activity(matched_acad)
    assert prof_acad["days_count"] == 1
    assert prof_acad["start_time"] == "18:30"
    assert prof_acad["end_time"] == "20:30"

    # 2. 測試服務性社團 (2天，18:30~21:00)
    matched_serv = sim_engine.match_nearest_club("汪汪社", all_clubs)
    assert "汪汪社" in matched_serv["name"]
    prof_serv = sim_engine.classify_club_activity(matched_serv)
    assert prof_serv["days_count"] == 2
    assert prof_serv["start_time"] == "18:30"
    assert prof_serv["end_time"] == "21:00"

    # 3. 測試表演性社團 (3天，18:30~21:30)
    matched_perf = sim_engine.match_nearest_club("火舞藝術研究社", all_clubs)
    assert "火舞" in matched_perf["name"]
    prof_perf = sim_engine.classify_club_activity(matched_perf)
    assert prof_perf["days_count"] == 3
    assert prof_perf["start_time"] == "18:30"
    assert prof_perf["end_time"] == "21:30"


def test_multi_club_scheduling_no_conflicts():
    """驗證多個社團同時參加時，活動日智慧分配且各時段無衝突"""
    profile = OnboardingParseSchema(
        department="資訊管理學系",
        grade=1,
        clubs=["火舞藝術研究社", "資訊管理學系系學會"]
    )
    schedule = sim_engine.build_weekly_schedule(None, profile)
    club_slots = [s for s in schedule if s.type == "club"]

    # 火舞社 3 天 + 系學會 1 天 = 總計 4 個社團行程
    assert len(club_slots) == 4

    # 確保所有社團時段都在 18:00 ~ 22:00 之間
    for s in club_slots:
        assert s.start_time >= "18:00"
        assert s.end_time <= "22:00"

    # 確保同一天晚上不撞期 (每天最多一個社團活動)
    days_with_clubs = [s.day for s in club_slots]
    assert len(days_with_clubs) == len(set(days_with_clubs)), "同一天晚上不應重複排定多個社團"


def test_evaluate_random_event_trigger_conditions_and_probability():
    """驗證突發事件觸發條件 (時間範圍、活動類型、前置活動、前置事件) 與自訂觸發機率"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.core.database import Base
    from app.models.tables import GameSession, RandomEvent

    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(test_engine)
    TestingSession = sessionmaker(bind=test_engine)
    db = TestingSession()

    # 1. 建立測試用事件庫
    evt_lunch = RandomEvent(
        id="evt_lunch_test",
        title="午餐排隊事件",
        is_active=True,
        weight=10,
        trigger_rate=1.0,  # 100% 觸發
        cond_time_start="12:00",
        cond_time_end="13:30",
        cond_activity_type="dining",
        event_prompt="學餐大排長龍",
        preset_options=[]
    )
    evt_pe = RandomEvent(
        id="evt_pe_test",
        title="體育課後痠痛",
        is_active=True,
        weight=10,
        trigger_rate=1.0,
        cond_prev_activity="體育",
        event_prompt="肌肉好痠痛",
        preset_options=[]
    )
    evt_seq = RandomEvent(
        id="evt_seq_test",
        title="松鼠續集",
        is_active=True,
        weight=10,
        trigger_rate=1.0,
        cond_prev_event_id="evt_squirrel_attack",
        event_prompt="松鼠又來了",
        preset_options=[]
    )
    evt_zero_rate = RandomEvent(
        id="evt_zero_test",
        title="零機率事件",
        is_active=True,
        weight=10,
        trigger_rate=0.0,
        event_prompt="絕不觸發",
        preset_options=[]
    )
    db.add_all([evt_lunch, evt_pe, evt_seq, evt_zero_rate])
    db.commit()

    # (A) 12:15 用餐時間 -> 應命中 evt_lunch
    session_a = GameSession(
        session_id="test_sess_1",
        player_profile={},
        weekly_schedule=[],
        current_turn=0,
        stats={"stamina": 80},
        visited_locs=[],
        triggered_evts=[],
        history_logs=[]
    )
    slot_lunch = {
        "start_time": "12:15",
        "end_time": "13:00",
        "type": "dining",
        "title": "午餐時段",
        "day": 1
    }
    result_a = sim_engine.evaluate_random_event_trigger(db, session_a, slot_lunch, default_trigger_prob=0.5)
    assert result_a is not None
    assert result_a.id == "evt_lunch_test"
    assert "evt_lunch_test" in session_a.triggered_evts

    # (B) 非 12:00~13:30 時間 (如 14:00) 且為 course -> 不應命中 evt_lunch
    session_b = GameSession(
        session_id="test_sess_2",
        player_profile={},
        weekly_schedule=[],
        current_turn=0,
        stats={"stamina": 80},
        visited_locs=[],
        triggered_evts=[],
        history_logs=[]
    )
    slot_afternoon = {
        "start_time": "14:00",
        "end_time": "16:00",
        "type": "course",
        "title": "企業管理",
        "day": 1
    }
    result_b = sim_engine.evaluate_random_event_trigger(db, session_b, slot_afternoon, default_trigger_prob=0.5)
    assert result_b is None

    # (C) 前置活動條件：先前歷史中曾參加過「體育」 -> 應命中 evt_pe
    session_c = GameSession(
        session_id="test_sess_3",
        player_profile={},
        weekly_schedule=[{"title": "大一體育 (羽球)", "type": "course"}],
        current_turn=1,
        stats={"stamina": 80},
        visited_locs=[],
        triggered_evts=[],
        history_logs=["體育課結束"]
    )
    result_c = sim_engine.evaluate_random_event_trigger(db, session_c, slot_afternoon, default_trigger_prob=0.5)
    assert result_c is not None
    assert result_c.id == "evt_pe_test"

    # (D) 前置事件條件：先前發生過 evt_squirrel_attack -> 應命中 evt_seq
    session_d = GameSession(
        session_id="test_sess_4",
        player_profile={},
        weekly_schedule=[],
        current_turn=0,
        stats={"stamina": 80},
        visited_locs=[],
        triggered_evts=["evt_squirrel_attack"],
        history_logs=[]
    )
    result_d = sim_engine.evaluate_random_event_trigger(db, session_d, slot_afternoon, default_trigger_prob=0.5)
    assert result_d is not None
    assert result_d.id == "evt_seq_test"

    # (E) 零機率事件 (trigger_rate=0.0) 絕不觸發
    db.query(RandomEvent).filter(RandomEvent.id.in_(["evt_lunch_test", "evt_pe_test", "evt_seq_test"])).delete()
    db.commit()
    session_e = GameSession(
        session_id="test_sess_5",
        player_profile={},
        weekly_schedule=[],
        current_turn=0,
        stats={"stamina": 80},
        visited_locs=[],
        triggered_evts=[],
        history_logs=[]
    )
    result_e = sim_engine.evaluate_random_event_trigger(db, session_e, slot_afternoon, default_trigger_prob=0.5)
    assert result_e is None

    # (F) 早晨時段語意匹配：cond_slots=["morning"] 搭配早八課程 slot="08:00" 或鬧鐘 slot="alarm_1_07:30"
    evt_morning = RandomEvent(
        id="evt_late_wakeup",
        title="早八生死時速危機",
        is_active=True,
        weight=20,
        trigger_rate=1.0,  # 100% 觸發
        cond_slots=["morning"],
        cond_days=[1, 2, 3, 4, 5],
        cond_min_stamina=0,
        cond_max_stamina=100,  # 支援一般與高體力
        event_prompt="鬧鐘沒響！驚醒發現已經 07:52！",
        preset_options=[]
    )
    db.add(evt_morning)
    db.commit()

    # (F1) 早八必修課時段 (slot="08:00", start_time="08:00", stamina=90) -> 必定觸發
    session_morning_course = GameSession(
        session_id="test_sess_morning_course",
        player_profile={},
        weekly_schedule=[],
        current_turn=0,
        stats={"stamina": 90},
        visited_locs=[],
        triggered_evts=[],
        history_logs=[]
    )
    slot_morning_course = {
        "start_time": "08:00",
        "end_time": "10:00",
        "slot": "08:00",
        "type": "course",
        "title": "計算機概論",
        "day": 1
    }
    result_morning_course = sim_engine.evaluate_random_event_trigger(
        db, session_morning_course, slot_morning_course, default_trigger_prob=0.5
    )
    assert result_morning_course is not None
    assert result_morning_course.id == "evt_late_wakeup"
    assert "evt_late_wakeup" in session_morning_course.triggered_evts

    # (F2) 鬧鐘起床時段 (slot="alarm_1_07:30", start_time="07:30", stamina=85) -> 必定觸發
    session_alarm = GameSession(
        session_id="test_sess_alarm",
        player_profile={},
        weekly_schedule=[],
        current_turn=0,
        stats={"stamina": 85},
        visited_locs=[],
        triggered_evts=[],
        history_logs=[]
    )
    slot_alarm = {
        "start_time": "07:30",
        "end_time": "08:00",
        "slot": "alarm_1_07:30",
        "type": "alarm",
        "title": "⏰ 鬧鐘響起 · 晨起梳洗 (07:30)",
        "day": 1
    }
    result_alarm = sim_engine.evaluate_random_event_trigger(
        db, session_alarm, slot_alarm, default_trigger_prob=0.5
    )
    assert result_alarm is not None
    assert result_alarm.id == "evt_late_wakeup"







