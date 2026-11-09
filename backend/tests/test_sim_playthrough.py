"""F2：從 start 一路玩到結局的完整流程（不啟用 LLM 與隨機事件）。"""

import pytest

from app.core.database import SessionLocal
from app.models.tables import GameSession
from tests.sim_helpers import SIM, client

pytestmark = pytest.mark.usefixtures("offline_engine")


def play(option: str, department: str, grade: int) -> dict:
    r = client.post(f"{SIM}/start", json={"user_input": "我想加入熱舞社", "department": department, "grade": grade})
    assert r.status_code == 200, r.text
    sid = r.json()["session_id"]
    try:
        last_key = (0, "00:00")
        for _ in range(300):
            state = client.get(f"{SIM}/session/{sid}")
            assert state.status_code == 200
            body = state.json()
            for v in body["stats"].values():
                assert v >= 0
            for k in ("stamina", "study", "social"):
                assert body["stats"][k] <= 100
            if body["is_game_over"]:
                break
            slot = body["weekly_schedule"][body["current_turn"]]
            key = (body["current_day"], body["current_time"])
            assert key >= last_key, f"時間倒退 {last_key} -> {key}"
            last_key = key
            kind = slot["type"]
            if kind == "day_end" and slot["day"] < 5:
                resp = client.post(
                    f"{SIM}/pre-plan-tomorrow",
                    json={"session_id": sid, "target_day": slot["day"] + 1, "slots": [],
                          "sleep_time": "23:00", "alarm_time": "07:30"},
                )
            else:
                choice = "B" if kind in ("lunch_prompt", "dinner_prompt") else ("C" if kind == "leisure_prompt" else option)
                if kind == "day_end":
                    choice = "A"
                resp = client.post(f"{SIM}/next-turn", json={"session_id": sid, "option_key": choice})
            assert resp.status_code == 200, f"{kind}: {resp.text}"
        else:
            pytest.fail("300 步內沒有結束")
        summary = client.post(f"{SIM}/summary", json={"session_id": sid})
        assert summary.status_code == 200
        return {"stats": body["stats"], "title": summary.json()["title"], "ending": body.get("ending")}
    finally:
        with SessionLocal() as db:
            db.query(GameSession).filter(GameSession.session_id == sid).delete()
            db.commit()


@pytest.mark.parametrize("option", ["A", "B", "C"])
@pytest.mark.parametrize("department,grade", [("資訊管理學系", 1), ("電機工程學系", 2), ("數學系", 4)])
def test_full_week_runs_to_the_end_without_errors(option, department, grade):
    result = play(option, department, grade)
    assert result["title"]


def test_different_strategies_end_differently():
    a = play("A", "資訊管理學系", 1)
    b = play("B", "資訊管理學系", 1)
    assert a["stats"] != b["stats"]
