"""A1：/next-turn 套用該回合選項自己的數值並驗證選項代號。"""

import pytest

from tests.sim_helpers import CLUB_EFFECTS, SIM, client, club_profile, club_schedule, load_session

pytestmark = pytest.mark.usefixtures("offline_engine")


@pytest.mark.parametrize("key", ["A", "B", "C"])
def test_next_turn_uses_the_turn_preset_effects(make_session, key):
    sid = make_session(club_schedule(), profile=club_profile())
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": key})
    assert r.status_code == 200
    expected = CLUB_EFFECTS[key]
    delta = r.json()["delta_stats"]
    for stat in ("stamina", "study", "social", "money"):
        assert delta[stat] == expected[stat]


def test_next_turn_rejects_key_not_offered_this_turn(make_session):
    sid = make_session(club_schedule(), profile=club_profile(option_keys=("A", "B")))
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "C"})
    assert r.status_code == 400
    # 被拒絕時不能推進回合或改變數值
    s = load_session(sid)
    assert s.current_turn == 0
    assert s.stats == {"stamina": 80, "study": 50, "social": 50, "money": 1500}


def test_next_turn_delta_is_the_actual_clamped_change(make_session):
    sid = make_session(
        club_schedule(),
        profile=club_profile(),
        stats={"stamina": 3, "study": 50, "social": 99, "money": 10},
    )
    r = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": "C"})
    assert r.status_code == 200
    body = r.json()
    assert body["stats"]["social"] == 100 and body["delta_stats"]["social"] == 1
    assert body["stats"]["stamina"] == 8 and body["delta_stats"]["stamina"] == 5
    assert body["stats"]["money"] == 0 and body["delta_stats"]["money"] == -10


def test_session_can_be_restored_after_reload(make_session):
    sid = make_session(club_schedule(), profile=club_profile())
    # 還原前先讓後端產生這回合敘事（含保存的 story）
    from app.core.database import SessionLocal
    from app.models.tables import GameSession

    with SessionLocal() as db:
        s = db.query(GameSession).filter(GameSession.session_id == sid).one()
        profile = dict(s.player_profile)
        profile["active_turn"] = {**profile["active_turn"], "story": {
            "narrative": "社團開始了", "options": [{"option_key": "A", "display_text": "投入"}]}}
        s.player_profile = profile
        db.commit()
    r = client.get(f"{SIM}/session/{sid}")
    assert r.status_code == 200
    body = r.json()
    assert body["current_turn"] == 0 and body["is_game_over"] is False
    assert body["story"]["narrative"] == "社團開始了"
    assert "active_turn" not in body["player_profile"]
    assert client.get(f"{SIM}/session/does-not-exist").status_code == 404


def test_finished_session_reports_game_over(make_session):
    sid = make_session(club_schedule(), current_turn=2)
    body = client.get(f"{SIM}/session/{sid}").json()
    assert body["is_game_over"] is True and body["story"] is None
