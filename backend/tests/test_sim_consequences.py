"""B1：缺課依時數扣學業、體力歸零昏倒結局。"""

import pytest

from tests.sim_helpers import CLUB_EFFECTS, SIM, client, club_profile, club_schedule, load_session, slot

pytestmark = pytest.mark.usefixtures("offline_engine")


def test_oversleep_penalty_is_eight_study_per_missed_hour(make_session):
    schedule = [
        slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"),
        slot(2, "08:00", "10:00", title="早八"),  # 2 小時 → -16
        slot(2, "13:00", "14:50", title="下午課"),
    ]
    sid = make_session(schedule=schedule, current_turn=0)
    r = client.post(
        f"{SIM}/pre-plan-tomorrow",
        json={"session_id": sid, "target_day": 2, "slots": [], "sleep_time": "23:00", "alarm_time": "12:00"},
    )
    assert r.status_code == 200
    assert r.json()["delta_stats"]["study"] == -16
    s = load_session(sid)
    assert s.stats["study"] == 34
    assert s.player_profile["absences"] == 1
    assert s.player_profile["absence_hours"] == 2.0


def test_attending_class_has_no_penalty(make_session):
    sid = make_session(
        schedule=[slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"), slot(2, "08:00", "10:00")],
        current_turn=0,
    )
    r = client.post(
        f"{SIM}/pre-plan-tomorrow", json={"session_id": sid, "target_day": 2, "alarm_time": "07:00"}
    )
    assert r.json()["delta_stats"].get("study", 0) == 0
    assert load_session(sid).stats["study"] == 50


def test_zero_stamina_ends_the_game_with_faint(make_session):
    expected_loss = -CLUB_EFFECTS["A"]["stamina"]
    assert expected_loss > 0
    sid = make_session(
        club_schedule(), profile=club_profile(),
        stats={"stamina": expected_loss, "study": 50, "social": 50, "money": 1500},
    )
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"})
    assert r.status_code == 200
    body = r.json()
    assert body["is_game_over"] is True and body["ending"] == "faint"
    assert body["stats"]["stamina"] == 0
    assert load_session(sid).player_profile["ending"] == "faint"
    # 昏倒後不能再繼續玩
    assert client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"}).status_code == 409
    summary = client.post(f"{SIM}/summary", json={"session_id": sid})
    assert summary.status_code == 200
    assert "昏倒" in summary.json()["summary_diary"] or "保健室" in summary.json()["title"]


def test_stamina_above_zero_keeps_playing(make_session):
    sid = make_session(club_schedule(), profile=club_profile(), stats={"stamina": 50, "study": 50, "social": 50, "money": 1500})
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"})
    assert r.json().get("ending") is None


def _s(stats, absences=0, visited=()):
    from types import SimpleNamespace
    return SimpleNamespace(
        stats={"stamina": 60, "study": 50, "social": 50, "money": 1500, **stats},
        player_profile={"absences": absences}, visited_locs=list(visited),
    )


def test_titles_consider_absences_money_and_stamina():
    from app.services.sim_engine import pick_title

    assert pick_title(_s({"study": 90})) == "中大書卷獎領跑者"
    assert pick_title(_s({"study": 90}, absences=1)) != "中大書卷獎領跑者"
    assert pick_title(_s({"study": 90, "stamina": 10})) != "中大書卷獎領跑者"
    assert pick_title(_s({}, absences=3)) == "與教室緣分很淺的自由靈魂"
    assert pick_title(_s({"money": 0})) == "月底吃土的窮忙大學生"
    assert pick_title(_s({"social": 90})) == "全方位百花川系核"
    assert pick_title(_s({"social": 90, "study": 10})) != "全方位百花川系核"
    assert pick_title(_s({})) == "從容漫步的大一新鮮人"


def test_changing_buildings_between_classes_costs_stamina(make_session, monkeypatch):
    from app.api import sim as sim_api

    monkeypatch.setattr(sim_api, "travel_distance_between", lambda a, b: 600.0 if a != b else 0.0)
    schedule = [
        slot(1, "08:00", "09:50", title="課A"),
        slot(1, "10:00", "11:50", title="課B"),
    ]
    schedule[1]["location_id"] = "bldg_general_edu"
    sid = make_session(schedule=schedule, current_turn=0, profile=club_profile())

    before = load_session(sid).stats["stamina"]
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "A"})
    assert r.status_code == 200
    # 600m → 3 點體力，另外加上選項本身的效果
    assert r.json()["delta_stats"]["stamina"] <= -3
    assert load_session(sid).stats["stamina"] <= before - 3


def test_multi_room_location_uses_first_recognised_room():
    from app.services.sim_engine import map_campus_location

    bid, name = map_campus_location("I1-105 / 綜教館-210", "測試課", "資訊管理學系")
    single_bid, _ = map_campus_location("I1-105", "測試課", "資訊管理學系")
    assert bid == single_bid
    assert "I1-105" in name and "210" not in name
