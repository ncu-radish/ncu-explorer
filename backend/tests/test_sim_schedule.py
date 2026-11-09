"""C1／C2：社團與課程不衝突、系學會配對正確。"""

import pytest

from app.schemas.llm import OnboardingParseSchema
from app.services.sim_engine import DEPT_CLUB_NAMES, sim_engine, time_to_minutes

DEPTS = list(DEPT_CLUB_NAMES)


def overlaps(a, b):
    return time_to_minutes(a.start_time) < time_to_minutes(b.end_time) and time_to_minutes(
        b.start_time
    ) < time_to_minutes(a.end_time)


@pytest.mark.parametrize("dept", DEPTS)
@pytest.mark.parametrize("grade", [1, 2, 3, 4])
def test_clubs_never_overlap_courses_or_each_other(dept, grade):
    profile = OnboardingParseSchema(
        department=dept, grade=grade, clubs=["熱門舞蹈社", "系學會", "吉他社"]
    )
    notes: list[str] = []
    schedule = sim_engine.build_weekly_schedule(None, profile, notes=notes)
    for day in range(1, 6):
        busy = [s for s in schedule if s.day == day and s.type in ("course", "club")]
        for i, a in enumerate(busy):
            for b in busy[i + 1:]:
                assert not overlaps(a, b), f"{dept} 大{grade} 週{day}: {a.title} vs {b.title}"


@pytest.fixture(scope="module")
def clubs():
    return sim_engine.load_all_clubs(None)


@pytest.mark.parametrize("dept,club", [(d, c) for d, c in DEPT_CLUB_NAMES.items()])
def test_dept_club_matches_own_department(clubs, dept, club):
    names = {c["name"] for c in clubs}
    if club not in names:
        pytest.skip(f"資料庫沒有 {club}")
    assert sim_engine.match_nearest_club("系學會", clubs, dept_hint=dept)["name"] == club


def test_unknown_clubs_are_not_randomly_matched(clubs):
    assert sim_engine.match_nearest_club("電競社", clubs) is None
    assert sim_engine.match_nearest_club("系學會", clubs, dept_hint=None) is None
    m = sim_engine.match_nearest_club("棒球", clubs)
    assert m is None or "棒" in m["name"]


def test_unmatched_club_is_reported_in_notes():
    notes: list[str] = []
    profile = OnboardingParseSchema(department="資訊管理學系", grade=1, clubs=["電競社"])
    sim_engine.build_weekly_schedule(None, profile, notes=notes)
    assert any("電競社" in n for n in notes)


# ---------------------------------------------------------------- C4 / C5
def _mins(t):
    return time_to_minutes(t)


@pytest.mark.parametrize("dept", DEPTS)
@pytest.mark.parametrize("grade", [1, 2, 3, 4])
def test_meal_prompt_exists_whenever_there_is_a_gap(dept, grade):
    """有 >= 30 分鐘空檔就一定有餐點提示；整段被課程塞滿（無法不翹課吃飯）的日子除外。"""
    from app.services.sim_engine import DINNER_WINDOW, LUNCH_WINDOW, free_gaps

    profile = OnboardingParseSchema(department=dept, grade=grade, clubs=["熱門舞蹈社"])
    schedule = sim_engine.build_weekly_schedule(None, profile)
    for day in range(1, 6):
        fixed = sorted(
            (_mins(s.start_time), _mins(s.end_time)) for s in schedule if s.day == day and s.type in ("course", "club")
        )
        types = {s.type for s in schedule if s.day == day}
        for prompt, (lo, hi) in (("lunch_prompt", LUNCH_WINDOW), ("dinner_prompt", DINNER_WINDOW)):
            has_gap = any(min(e, hi) - max(b, lo) >= 30 for b, e in free_gaps(fixed, 8 * 60, 21 * 60))
            assert (prompt in types) == has_gap, f"{dept} 大{grade} 週{day} {prompt}"


@pytest.mark.parametrize("dept", DEPTS[:6])
def test_prompts_never_overlap_fixed_events_or_each_other(dept):
    profile = OnboardingParseSchema(department=dept, grade=2, clubs=["熱門舞蹈社", "系學會"])
    schedule = sim_engine.build_weekly_schedule(None, profile)
    for day in range(1, 6):
        day_slots = [s for s in schedule if s.day == day and s.type != "day_end"]
        for i, a in enumerate(day_slots):
            for b in day_slots[i + 1:]:
                assert not overlaps(a, b), f"{dept} 週{day}: {a.title}({a.type}) vs {b.title}({b.type})"


def test_free_gap_helpers():
    from app.services.sim_engine import free_gaps, pick_meal_window

    assert free_gaps([(600, 700), (800, 900)], 480, 1000) == [(480, 600), (700, 800), (900, 1000)]
    assert pick_meal_window([(660, 690)], (660, 840), 720) == (660, 690)
    assert pick_meal_window([(660, 685)], (660, 840), 720) is None


def test_over_credit_limit_is_reported_not_trimmed():
    notes: list[str] = []
    profile = OnboardingParseSchema(department="電機工程學系", grade=1, clubs=[])
    schedule = sim_engine.build_weekly_schedule(None, profile, notes=notes)
    total = sum(
        (s.credits or 0) for s in {s.course_id: s for s in schedule if s.type == "course"}.values()
    )
    if total > 25:
        assert any("學分" in n and "上限" in n for n in notes)


def test_empty_days_still_get_daily_checkpoints():
    profile = OnboardingParseSchema(department="數學系", grade=4, clubs=[])
    schedule = sim_engine.build_weekly_schedule(None, profile)
    for day in range(1, 6):
        assert any(s.day == day for s in schedule), f"週{day} 沒有任何行程"
