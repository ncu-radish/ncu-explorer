"""休閒活動：每張卡片是獨立活動，效果各自計算。"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.admin import DEFAULT_CAMPUS_ACTIVITIES, LEGACY_ACTIVITY_TITLES, ensure_activities_seeded
from app.core.database import Base
from app.models.tables import CampusActivity
from tests.sim_helpers import SIM, client, load_session, slot

pytestmark = pytest.mark.usefixtures("offline_engine")


def test_player_activity_list_is_public_and_split_per_card():
    r = client.get(f"{SIM}/activities")
    assert r.status_code == 200
    by_cat: dict[str, list[dict]] = {}
    for a in r.json():
        by_cat.setdefault(a["category"], []).append(a)
    assert len(by_cat["dorm_leisure"]) >= 3
    assert len(by_cat["campus_leisure"]) >= 4
    ids = [a["id"] for a in r.json()]
    assert len(ids) == len(set(ids))
    for a in by_cat["dorm_leisure"]:
        assert a["preset_options"] and all("effects" in o for o in a["preset_options"])


def leisure_schedule():
    return [
        slot(1, "16:50", "18:30", "leisure_prompt", "課餘空閒", "bldg_dorm_b9a"),
        slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"),
    ]


def pick(activity_id, option="A"):
    return {"activity_id": activity_id, "option_key": option, "duration_hours": 1}


def test_different_dorm_cards_have_different_effects(make_session):
    results = {}
    for act_id in ("act_dorm_leisure", "act_dorm_gaming", "act_dorm_chores"):
        sid = make_session(leisure_schedule(), stats={"stamina": 50, "study": 50, "social": 50, "money": 1500})
        r = client.post(f"{SIM}/trigger-activity", json={"session_id": sid, **pick(act_id)})
        assert r.status_code == 200, r.text
        results[act_id] = r.json()["delta_stats"]
        assert load_session(sid).current_turn >= 1
    assert results["act_dorm_leisure"] != results["act_dorm_gaming"] != results["act_dorm_chores"]
    assert results["act_dorm_leisure"]["stamina"] > results["act_dorm_gaming"]["stamina"] - 1
    assert results["act_dorm_gaming"]["social"] > results["act_dorm_leisure"]["social"]


def test_option_effects_differ_within_a_card(make_session):
    deltas = []
    for opt in ("A", "B"):
        sid = make_session(leisure_schedule(), stats={"stamina": 50, "study": 50, "social": 50, "money": 1500})
        r = client.post(f"{SIM}/trigger-activity", json={"session_id": sid, **pick("act_dorm_leisure", opt)})
        deltas.append(r.json()["delta_stats"]["stamina"])
    assert deltas[0] > deltas[1]


def test_legacy_combined_activities_are_upgraded_without_touching_edited_ones():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    legacy = next(a for a in DEFAULT_CAMPUS_ACTIVITIES if a["id"] == "act_dorm_leisure")
    db.add(CampusActivity(**{**legacy, "title": LEGACY_ACTIVITY_TITLES["act_dorm_leisure"]}))
    edited = next(a for a in DEFAULT_CAMPUS_ACTIVITIES if a["id"] == "act_campus_leisure")
    db.add(CampusActivity(**{**edited, "title": "管理員改過的標題"}))
    db.commit()

    ensure_activities_seeded(db)
    ids = {a.id for a in db.query(CampusActivity).all()}
    assert {"act_dorm_gaming", "act_dorm_chores", "act_campus_gym", "act_campus_library", "act_campus_lake"} <= ids
    assert db.get(CampusActivity, "act_dorm_leisure").title == legacy["title"]  # 舊內容已升級
    assert db.get(CampusActivity, "act_campus_leisure").title == "管理員改過的標題"  # 管理員改過的不動
