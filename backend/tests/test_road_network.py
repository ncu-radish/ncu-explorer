import math

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.road_network import BuildingBox, RoadNetwork, RouteNotFoundError

client = TestClient(app)


def _grid() -> RoadNetwork:
    """
    n0 --- n1 --- n2
            |
           n3
    另有孤立的 n4 --- n5
    """
    nodes = [(0, 0, 0), (100, 0, 0), (200, 0, 0), (100, 0, 100), (500, 0, 500), (600, 0, 500)]
    edges = [(0, 1), (1, 2), (1, 3), (4, 5)]
    boxes = {
        "left": BuildingBox(-5, 5, 10, 20),  # 在 n0-n1 邊的上方
        "right": BuildingBox(195, 205, 10, 20),  # 在 n1-n2 邊的上方
        "south": BuildingBox(95, 105, 120, 130),  # 在 n1-n3 邊的下方
        "island": BuildingBox(540, 560, 510, 520),
        "same_edge": BuildingBox(45, 55, 10, 20),
    }
    return RoadNetwork([tuple(map(float, n)) for n in nodes], edges, boxes)  # type: ignore[misc]


def test_building_attaches_to_nearest_point_on_edge_not_vertex():
    net = _grid()
    acc = net.access["same_edge"]
    # 建築在 x=50 附近，應接在 n0-n1 邊的中段，而不是端點
    assert acc.edge == 0
    assert 0.4 < acc.t < 0.6


def test_shortest_path_follows_roads():
    net = _grid()
    distance, path = net.route("left", "right")
    # left 接在 n0 附近，right 接在 n2 附近，要經過 n1
    assert math.isclose(distance, 200, abs_tol=1.0)
    assert path[0] == net.access["left"].point
    assert path[-1] == net.access["right"].point
    assert (100.0, 0.0, 0.0) in path


def test_same_edge_route_is_direct():
    net = _grid()
    distance, path = net.route("left", "same_edge")
    assert distance < 60
    assert len(path) == 2


def test_unreachable_raises():
    net = _grid()
    with pytest.raises(RouteNotFoundError):
        net.route("left", "island")


def test_legacy_location_ids_are_resolved():
    net = _grid()
    net.access["bldg_res_core"] = net.access["right"]
    net.access["bldg_dorm_b9a"] = net.access["left"]
    distance, _ = net.route("loc_dorm_boy9", "loc_pine_restaurant")
    assert distance == net.route("left", "right")[0]


def test_unknown_building_raises_keyerror():
    net = _grid()
    with pytest.raises(KeyError):
        net.route("left", "nope")


needs_assets = pytest.mark.skipif(
    not (settings.ROAD_NETWORK_PATH.exists() and settings.CAMPUS_MODEL_PATH.exists()),
    reason="需要 road_network.json 與 campus_buildings.glb",
)


@needs_assets
def test_route_api_returns_path():
    resp = client.get("/api/explore/route", params={"from_id": "bldg_lib_main", "to_id": "bldg_admin"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["distance"] > 0
    assert len(data["path"]) >= 2
    assert all(len(p) == 3 for p in data["path"])


@needs_assets
def test_road_network_api_returns_segments():
    resp = client.get("/api/explore/road-network")
    assert resp.status_code == 200
    segments = resp.json()["segments"]
    assert len(segments) > 0
    assert all(len(seg) == 2 and all(len(p) == 3 for p in seg) for seg in segments)


@needs_assets
def test_route_api_unknown_building_is_404():
    resp = client.get("/api/explore/route", params={"from_id": "bldg_lib_main", "to_id": "bldg_nope"})
    assert resp.status_code == 404
