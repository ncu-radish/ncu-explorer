"""模擬器 API 測試共用工具。"""

from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models.tables import GameSession

client = TestClient(app, raise_server_exceptions=False)
SIM = f"{settings.API_V1_STR}/sim"

CLUB_EFFECTS = {
    "A": {"stamina": -12, "study": 0, "social": 12, "money": 0},
    "B": {"stamina": -8, "study": 0, "social": 15, "money": -50},
    "C": {"stamina": 5, "study": 0, "social": 18, "money": -120},
}


def slot(day, start, end, type_="course", title="課", location="bldg_mgmt_2", **extra):
    return {
        "day": day, "slot": start, "title": title, "type": type_, "location_id": location,
        "start_time": start, "end_time": end, "display_time": f"{start} ~ {end}", **extra,
    }


def club_schedule():
    return [
        slot(1, "18:30", "21:00", "club", "熱舞社", "bldg_jude"),
        slot(1, "21:00", "22:00", "day_end", "夜幕結算", "bldg_dorm_b9a"),
    ]


def club_profile(option_keys=("A", "B", "C")) -> dict:
    return {
        "home_dorm_id": "bldg_dorm_b9a",
        "active_turn": {"turn": 0, "option_keys": list(option_keys), "effects_map": CLUB_EFFECTS},
    }


def load_session(sid):
    db = SessionLocal()
    s = db.query(GameSession).filter(GameSession.session_id == sid).first()
    db.expunge(s)
    db.close()
    return s
