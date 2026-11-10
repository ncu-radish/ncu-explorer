"""D1：突發事件冷卻、次數上限與情境條件。"""

import random

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.tables import GameSession, RandomEvent
from app.services.sim_engine import (
    EVENT_MIN_GAP_TURNS,
    MAX_EVENT_OCCURRENCES,
    sim_engine,
)


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    s = sessionmaker(bind=engine)()
    yield s
    s.close()


def add_event(db, **kw):
    base = dict(
        title="測試", is_active=True, weight=10, trigger_rate=1.0, cond_days=[1, 2, 3, 4, 5],
        cond_slots=[], cond_min_stamina=0, cond_max_stamina=100, event_prompt="x", preset_options=[],
    )
    base.update(kw)
    db.add(RandomEvent(**base))
    db.commit()


def make_game(schedule):
    return GameSession(
        session_id="evt-test", player_profile={}, weekly_schedule=schedule, current_turn=0,
        stats={"stamina": 80, "study": 50, "social": 50, "money": 1500},
        visited_locs=[], triggered_evts=[], history_logs=[],
    )


def course(day, start, end):
    return {"day": day, "slot": start, "start_time": start, "end_time": end, "type": "course", "title": "課"}


def test_event_respects_cap_and_spacing(db):
    random.seed(1)
    add_event(db, id="evt_a")
    schedule = [course(1 + i % 5, "10:00", "10:50") for i in range(60)]
    game = make_game(schedule)
    fired: list[int] = []
    for turn in range(60):
        game.current_turn = turn
        # 每天只觸發一次：換日後才會再觸發
        if sim_engine.evaluate_random_event_trigger(db, game, schedule[turn], 1.0):
            fired.append(turn)
    assert game.triggered_evts.count("evt_a") <= MAX_EVENT_OCCURRENCES
    assert all(b - a >= EVENT_MIN_GAP_TURNS for a, b in zip(fired, fired[1:], strict=False))


def test_same_event_only_once_per_day(db):
    add_event(db, id="evt_a")
    schedule = [course(1, "10:00", "10:50")] * 10
    game = make_game(schedule)
    hits = 0
    for turn in range(10):
        game.current_turn = turn
        hits += bool(sim_engine.evaluate_random_event_trigger(db, game, schedule[turn], 1.0))
    assert hits == 1


def test_late_wakeup_only_before_first_class(db):
    add_event(db, id="evt_late_wakeup", cond_slots=["morning"])
    schedule = [course(1, "09:00", "09:50"), course(1, "10:00", "10:50")]
    game = make_game(schedule)
    game.current_turn = 0
    assert sim_engine.evaluate_random_event_trigger(db, game, schedule[0], 1.0) is None  # 第一堂課 09:00，不是早八
    schedule2 = [course(1, "08:00", "08:50"), course(1, "10:00", "10:50")]
    game2 = make_game(schedule2)
    assert sim_engine.evaluate_random_event_trigger(db, game2, schedule2[0], 1.0) is not None
    game3 = make_game(schedule2)
    game3.current_turn = 1
    assert sim_engine.evaluate_random_event_trigger(db, game3, schedule2[1], 1.0) is None


def test_squirrel_breakfast_event_not_in_afternoon(db):
    add_event(db, id="evt_squirrel_attack", cond_slots=["morning", "afternoon"])
    schedule = [course(1, "14:00", "14:50")]
    game = make_game(schedule)
    assert sim_engine.evaluate_random_event_trigger(db, game, schedule[0], 1.0) is None
