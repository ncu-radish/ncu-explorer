import uuid

import pytest

from app.services.course_db import BACKEND_DATA_DIR, resolve_courses_db_path
from app.services.mock_course_db import ensure_mock_courses_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_courses_db():
    """確保在沒有真實 courses.db 時，自動初始化輕量測試資料庫，使 CI 穩定通過"""
    if resolve_courses_db_path() is None:
        target = BACKEND_DATA_DIR / "courses.db"
        ensure_mock_courses_db(target)


@pytest.fixture()
def offline_engine(monkeypatch):
    """模擬器流程測試用：不呼叫 Ollama、不觸發隨機事件，結果可重現。"""
    from app.services import sim_engine as sim_engine_module

    async def fake_llm(*, fallback_instance=None, **_kwargs):
        return fallback_instance

    monkeypatch.setattr(sim_engine_module, "call_ollama_structured", fake_llm)
    monkeypatch.setattr(
        sim_engine_module.sim_engine, "evaluate_random_event_trigger", lambda *a, **k: None
    )


@pytest.fixture()
def make_session(offline_engine):
    """建立一個指定課表／數值的 GameSession，測試結束後自動刪除。"""
    from app.api.explore import ensure_buildings_seeded
    from app.core.database import SessionLocal
    from app.models.tables import GameSession

    created: list[str] = []

    def _make(schedule, current_turn=0, profile=None, stats=None) -> str:
        sid = str(uuid.uuid4())
        db = SessionLocal()
        ensure_buildings_seeded(db)
        db.add(GameSession(
            session_id=sid,
            player_profile=profile or {"home_dorm_id": "bldg_dorm_b9a"},
            weekly_schedule=schedule,
            current_turn=current_turn,
            stats=stats or {"stamina": 80, "study": 50, "social": 50, "money": 1500},
            visited_locs=[],
            triggered_evts=[],
            history_logs=[],
        ))
        db.commit()
        db.close()
        created.append(sid)
        return sid

    yield _make
    db = SessionLocal()
    for sid in created:
        db.query(GameSession).filter(GameSession.session_id == sid).delete()
    db.commit()
    db.close()
