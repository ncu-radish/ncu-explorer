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

