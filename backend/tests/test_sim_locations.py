import uuid

import pytest
from fastapi.testclient import TestClient

from app.api.explore import ensure_buildings_seeded
from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models.tables import GameSession

client = TestClient(app)

needs_assets = pytest.mark.skipif(
    not (settings.ROAD_NETWORK_PATH.exists() and settings.CAMPUS_MODEL_PATH.exists()),
    reason="需要 road_network.json 與 campus_buildings.glb",
)


@pytest.fixture()
def session_id():
    sid = str(uuid.uuid4())
    db = SessionLocal()
    ensure_buildings_seeded(db)
    schedule = [
        {"day": 1, "slot": "10:00", "title": "課", "type": "course", "location_id": "bldg_mgmt_2",
         "start_time": "10:00", "end_time": "12:00"},
        {"day": 1, "slot": "12:00", "title": "午餐", "type": "lunch_prompt", "location_id": "loc_pine_restaurant",
         "start_time": "12:00", "end_time": "13:00"},
    ]
    db.add(GameSession(
        session_id=sid,
        player_profile={"home_dorm_id": "bldg_dorm_g14"},
        weekly_schedule=schedule,
        current_turn=1,
        stats={"stamina": 80, "study": 50, "social": 50, "money": 1500},
        visited_locs=[],
        triggered_evts=[],
        history_logs=[],
    ))
    db.commit()
    db.close()
    yield sid
    db = SessionLocal()
    db.query(GameSession).filter(GameSession.session_id == sid).delete()
    db.commit()
    db.close()


@needs_assets
def test_meal_options_returns_three_stable_places(session_id):
    r1 = client.get("/api/sim/meal-options", params={"session_id": session_id, "category": "lunch"})
    assert r1.status_code == 200
    opts = r1.json()
    assert len(opts) == 3 and len({o["id"] for o in opts}) == 3
    assert all(o["distance"] is not None for o in opts)
    r2 = client.get("/api/sim/meal-options", params={"session_id": session_id, "category": "lunch"})
    assert r1.json() == r2.json()


def test_meal_options_rejects_bad_category(session_id):
    r = client.get("/api/sim/meal-options", params={"session_id": session_id, "category": "breakfast"})
    assert r.status_code == 400


@needs_assets
def test_sport_activity_requires_sport_building(session_id):
    base = {"session_id": session_id, "activity_id": "act_campus_sport", "option_key": "A", "duration_hours": 1}
    bad = client.post("/api/sim/trigger-activity", json={**base, "location_id": "bldg_mgmt_2"})
    assert bad.status_code == 400
    ok = client.post("/api/sim/trigger-activity", json={**base, "location_id": "bldg_badminton"})
    assert ok.status_code == 200
    assert ok.json()["current_location_id"] == "bldg_badminton"


@needs_assets
def test_meal_location_must_be_one_of_the_options(session_id):
    base = {"session_id": session_id, "activity_id": "act_lunch", "option_key": "A", "duration_hours": 1}
    bad = client.post("/api/sim/trigger-activity", json={**base, "location_id": "bldg_mgmt_2"})
    assert bad.status_code == 400
    options = client.get("/api/sim/meal-options", params={"session_id": session_id, "category": "lunch"}).json()
    ok = client.post("/api/sim/trigger-activity", json={**base, "location_id": options[0]["id"]})
    assert ok.status_code == 200


def test_walking_minutes_rounds_up():
    from app.services.sim_engine import WALK_SPEED_M_PER_MIN, walking_minutes

    assert walking_minutes(0) == 0
    assert walking_minutes(0.5) == 0
    assert walking_minutes(1) == 1
    assert walking_minutes(WALK_SPEED_M_PER_MIN) == 1
    assert walking_minutes(WALK_SPEED_M_PER_MIN + 1) == 2


@needs_assets
def test_trigger_activity_includes_walking_time(session_id):
    from app.api.sim import travel_minutes_between

    walk = travel_minutes_between("bldg_mgmt_2", "bldg_badminton")
    assert walk > 0
    base = {"session_id": session_id, "activity_id": "act_campus_sport", "option_key": "A", "duration_hours": 1}
    r = client.post("/api/sim/trigger-activity", json={**base, "location_id": "bldg_badminton"})
    assert r.status_code == 200
    slot = r.json()["marked_slot"]
    assert slot["travel_minutes"] == walk
    sh, sm = map(int, slot["start_time"].split(":"))
    eh, em = map(int, slot["end_time"].split(":"))
    assert (eh * 60 + em) - (sh * 60 + sm) == 60  # 步行算在時段內，結束時間不延後
    from app.api.sim import travel_distance_between
    from app.services.sim_engine import walking_stamina_cost

    cost = walking_stamina_cost(travel_distance_between("bldg_mgmt_2", "bldg_badminton"))
    assert r.json()["delta_stats"]["stamina"] == round(15 * max(0.25, (60 - walk) / 60)) - cost
