import random

from app.services.sim_engine import pick_meal_options

RESTAURANTS = ["res_a", "res_b", "res_c", "res_d"]
STREETS = {"street_night", "street_back"}


def test_includes_nearest_and_a_street():
    candidates = RESTAURANTS + sorted(STREETS)
    distances = {"res_a": 300.0, "res_b": 50.0, "res_c": 400.0, "res_d": 500.0, "street_night": 600.0, "street_back": 700.0}
    for seed in range(30):
        picked = pick_meal_options(candidates, distances, STREETS, random.Random(seed))
        assert len(picked) == 3 and len(set(picked)) == 3
        assert "res_b" in picked  # 最近的一定在
        assert any(p in STREETS for p in picked)


def test_nearest_may_itself_be_the_street():
    candidates = RESTAURANTS + sorted(STREETS)
    distances = {"res_a": 300.0, "res_b": 200.0, "res_c": 400.0, "res_d": 500.0, "street_night": 10.0, "street_back": 700.0}
    picked = pick_meal_options(candidates, distances, STREETS, random.Random(1))
    assert "street_night" in picked and len(picked) == 3


def test_without_streets_picks_three_restaurants():
    distances = {"res_a": 5.0, "res_b": 6.0, "res_c": 7.0, "res_d": 8.0}
    picked = pick_meal_options(RESTAURANTS, distances, set(), random.Random(0))
    assert len(picked) == 3 and "res_a" in picked


def test_without_distances_is_random_but_valid():
    picked = pick_meal_options(RESTAURANTS, {}, set(), random.Random(0))
    assert len(picked) == 3 and set(picked) <= set(RESTAURANTS)


def test_same_seed_is_stable():
    d = {"res_a": 1.0, "res_b": 2.0, "res_c": 3.0, "res_d": 4.0}
    a = pick_meal_options(RESTAURANTS, d, set(), random.Random("s:1:lunch"))
    b = pick_meal_options(RESTAURANTS, d, set(), random.Random("s:1:lunch"))
    assert a == b


def test_few_candidates_returns_all():
    assert pick_meal_options(["x", "y"], {}, set(), random.Random(0)) == ["x", "y"]
