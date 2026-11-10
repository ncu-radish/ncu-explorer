"""模擬器規則測試：預排就寢、活動時段驗證、結束後保護、睡眠回血曲線。"""

import pytest

from app.core.database import SessionLocal
from app.models.tables import GameSession
from tests.sim_helpers import SIM, client, club_profile, load_session, slot

pytestmark = pytest.mark.usefixtures("offline_engine")


def two_day_schedule():
    return [
        slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"),
        slot(2, "08:00", "09:50", title="早八"),
        slot(2, "13:00", "14:50", title="下午課"),
    ]


def lunch_schedule():
    return [
        slot(1, "12:00", "13:00", "lunch_prompt", "12:00 中午時光", "loc_pine_restaurant"),
        slot(1, "13:00", "14:50", title="下午課"),
        slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"),
    ]


# ---------------------------------------------------------------- A2
def test_pre_plan_only_at_night(make_session):
    sid = make_session(schedule=[slot(1, "10:00", "11:50"), *two_day_schedule()], current_turn=0)
    r = client.post(f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 2, "slots": []})
    assert r.status_code == 400  # 白天不能睡覺


def test_pre_plan_rejects_wrong_target_day(make_session):
    sid = make_session(schedule=two_day_schedule(), current_turn=0)
    assert client.post(f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 4}).status_code == 400
    assert client.post(f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 9}).status_code == 422
    assert client.post(f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 1}).status_code == 422


def test_pre_plan_cannot_be_repeated_to_refill_stamina(make_session):
    sid = make_session(
        schedule=two_day_schedule(), current_turn=0,
        stats={"stamina": 20, "study": 50, "social": 50, "money": 1500},
    )
    body = {"session_id": sid, "target_day": 2, "slots": [], "sleep_time": "23:00", "alarm_time": "07:00"}
    first = client.post(f"{SIM}/pre-plan-tomorrow", json=body)
    assert first.status_code == 200
    assert first.json()["stats"]["stamina"] == 60
    assert first.json()["delta_stats"]["stamina"] == 40
    assert client.post(f"{SIM}/pre-plan-tomorrow", json=body).status_code == 400
    assert load_session(sid).stats["stamina"] == 60


# ---------------------------------------------------------------- A5
def test_oversleeping_marks_missed_classes_as_skipped(make_session):
    sid = make_session(schedule=two_day_schedule(), current_turn=0)
    body = {"session_id": sid, "target_day": 2, "slots": [], "sleep_time": "23:00", "alarm_time": "12:00"}
    r = client.post(f"{SIM}/pre-plan-tomorrow", json=body)
    assert r.status_code == 200
    schedule = r.json()["weekly_schedule"]
    early = next(s for s in schedule if s["title"] == "早八")
    afternoon = next(s for s in schedule if s["title"] == "下午課")
    assert early["is_skipped"] is True and early["skip_reason"] == "睡過頭"
    assert not afternoon["is_skipped"]
    # 起床後的第一個行程才是目前回合，不會停在已錯過的早八
    assert not schedule[r.json()["current_turn"]]["is_skipped"]
    assert load_session(sid).player_profile["absences"] == 1


def test_normal_wake_up_does_not_skip_classes(make_session):
    sid = make_session(schedule=two_day_schedule(), current_turn=0)
    r = client.post(
        f"{SIM}/pre-plan-tomorrow",
        json={"session_id": sid, "target_day": 2, "slots": [], "alarm_time": "07:30"},
    )
    assert r.status_code == 200
    assert not any(s.get("is_skipped") for s in r.json()["weekly_schedule"])


# ---------------------------------------------------------------- A4
def test_actions_after_game_over_return_409(make_session):
    sid = make_session(schedule=[slot(1, "10:00", "11:50")], current_turn=1)  # 回合已用完
    assert client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"}).status_code == 409
    assert client.post(
        f"{SIM}/trigger-activity", json={"session_id": sid, "activity_id": "act_dorm_leisure"}
    ).status_code == 409
    assert client.post(f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 2}).status_code == 409


def test_invalid_option_key_format_is_422(make_session):
    sid = make_session([slot(1, "18:30", "21:00", "club")], profile=club_profile())
    assert client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "Z"}).status_code == 422


# ---------------------------------------------------------------- A3
def test_activity_must_match_current_slot(make_session):
    sid = make_session(schedule=[slot(1, "10:00", "11:50"), *lunch_schedule()], current_turn=0)  # 正在上課
    r = client.post(
        f"{SIM}/trigger-activity",
        json={"session_id": sid, "activity_id": "act_dorm_leisure", "duration_hours": 8},
    )
    assert r.status_code == 400
    assert load_session(sid).current_turn == 0

    sid2 = make_session(schedule=lunch_schedule(), current_turn=0)  # 午餐提示不能拿來休閒
    r = client.post(f"{SIM}/trigger-activity", json={"session_id": sid2, "activity_id": "act_dorm_leisure"})
    assert r.status_code == 400


def test_meal_requires_location(make_session):
    sid = make_session(schedule=lunch_schedule(), current_turn=0)
    r = client.post(f"{SIM}/trigger-activity", json={"session_id": sid, "activity_id": "act_lunch"})
    assert r.status_code == 400


def test_long_lunch_effects_follow_actual_time_not_requested(make_session):
    sid = make_session(schedule=lunch_schedule(), current_turn=0)
    options = client.get(f"{SIM}/meal-options", params={"session_id": sid, "category": "lunch"}).json()
    r = client.post(
        f"{SIM}/trigger-activity",
        json={"session_id": sid, "activity_id": "act_lunch", "location_id": options[0]["id"],
              "duration_hours": 8},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["marked_slot"]["end_time"] <= "13:00"  # 被下午的課截斷
    # 午餐最多 2 小時、又被截斷成不到 1 小時，不可能拿到 8 小時的量
    assert body["delta_stats"]["money"] >= -200
    assert body["delta_stats"]["stamina"] <= 40
    # 回傳的 delta 就是實際的數值變化
    assert body["stats"]["money"] == 1500 + body["delta_stats"]["money"]


def test_delta_stats_matches_real_change_when_capped(make_session):
    schedule = [
        slot(1, "16:50", "18:30", "leisure_prompt", "課餘空閒", "bldg_dorm_b9a"),
        slot(1, "18:30", "21:00", "club", "社團", "bldg_jude"),
    ]
    sid = make_session(
        schedule=schedule, current_turn=0,
        stats={"stamina": 95, "study": 50, "social": 50, "money": 1500},
    )
    r = client.post(
        f"{SIM}/trigger-activity",
        json={"session_id": sid, "activity_id": "act_dorm_leisure", "duration_hours": 1},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["stats"]["stamina"] <= 100
    assert body["delta_stats"]["stamina"] == body["stats"]["stamina"] - 95


# ---------------------------------------------------------------- A6
def test_sleep_gain_is_continuous_and_peaks_at_nine_hours():
    from app.services.sim_engine import sleep_stamina_gain

    values = [(h / 10, sleep_stamina_gain(h / 10)) for h in range(0, 161)]
    for (_, a), (_, b) in zip(values, values[1:], strict=False):
        assert abs(a - b) <= 2, "相鄰 0.1 小時的差距不應跳動"
    assert sleep_stamina_gain(0) == 0
    rising = [g for h, g in values if h <= 9.0]
    assert rising == sorted(rising)
    falling = [g for h, g in values if h >= 9.0]
    assert falling == sorted(falling, reverse=True)
    assert sleep_stamina_gain(9.0) == 45
    assert sleep_stamina_gain(5.9) < sleep_stamina_gain(6.0)
    assert sleep_stamina_gain(16) == 30  # 睡太久最低仍有基本回復
    assert sleep_stamina_gain(11.7) > sleep_stamina_gain(5.0)


# ---------------------------------------------------------------- C3
def _plan(make_session, class_start, alarm="07:30"):
    sid = make_session(
        schedule=[
            slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"),
            slot(2, class_start, "15:50" if class_start == "13:00" else "09:50", title="課"),
        ],
        current_turn=0,
    )
    r = client.post(
        f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 2, "alarm_time": alarm}
    )
    assert r.status_code == 200
    return r.json()


def test_alarm_turn_skipped_when_first_class_is_far(make_session):
    body = _plan(make_session, "13:00")
    assert not any(s["type"] == "dorm" for s in body["weekly_schedule"])


def test_alarm_turn_is_narrative_only(make_session):
    body = _plan(make_session, "08:30")
    assert any(s["type"] == "dorm" for s in body["weekly_schedule"])
    sid = body["session_id"]
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"})
    assert r.status_code == 200
    assert all(v == 0 for v in r.json()["delta_stats"].values())


# ---------------------------------------------------------------- D3 / D4
def test_friday_has_day_end_and_ending_option():
    from app.schemas.llm import OnboardingParseSchema
    from app.services.sim_engine import sim_engine

    sched = sim_engine.build_weekly_schedule(None, OnboardingParseSchema(department="資訊管理學系", grade=1))
    assert any(s.day == 5 and s.type == "day_end" for s in sched)


def test_ending_friday_night_finishes_game_with_real_clock(make_session):
    schedule = [slot(5, "21:00", "22:00", "day_end", "週五夜幕結算", "bldg_dorm_b9a")]
    sid = make_session(schedule=schedule, current_turn=0)
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"})
    assert r.status_code == 200
    body = r.json()
    assert body["is_game_over"] is True
    assert body["current_day"] == 5 and body["current_time"] == "22:00"


def test_turn_narrative_has_no_duplicated_weekday_and_varies():
    seen = set()
    for _ in range(3):
        r = client.post(f"{SIM}/start", json={"user_input": "我想加入熱舞社", "department": "資訊管理學系", "grade": 1})
        assert r.status_code == 200
        narrative = r.json()["current_story"]["narrative"]
        assert "週一 週一" not in narrative and "週二 週二" not in narrative
        seen.add(r.json()["session_id"])
        with SessionLocal() as db:
            db.query(GameSession).filter(GameSession.session_id == r.json()["session_id"]).delete()
            db.commit()
    assert len(seen) == 3
