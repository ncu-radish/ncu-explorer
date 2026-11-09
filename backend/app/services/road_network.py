"""校園路網與最短路徑。

- 路網來自 Blender 匯出的 ``road_network.json``（座標已是 Three.js 世界座標）。
- 建築位置讀取自前端使用的 ``campus_buildings.glb``，每個建築取其 XZ 包圍盒。
- 建築會接到「離其包圍盒最近的路段上一點」（投影到邊上，而非最近的頂點）。

此模組只負責路徑查詢，不修改任何模擬數值；若移動成本要影響遊戲數值，
必須由 ``sim_engine.py`` 計算。
"""

from __future__ import annotations

import heapq
import json
import math
import struct
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.core.config import settings

# 必須與 frontend/src/components/three/CampusScene.tsx 的 CAMPUS_OFFSET 相同
CAMPUS_OFFSET = (-535.8, 0.0, 344.54)

Point = tuple[float, float, float]

# 模擬器沿用的舊地點代碼 (campus_locations) -> 3D 地圖建築 id。
# 沒有對應建築的地點不在表內，無法規劃路線。
LEGACY_LOCATION_TO_BUILDING: dict[str, str] = {
    "loc_mgt2": "bldg_mgmt_2",
    "loc_eng5": "bldg_eng_5",
    "loc_sci5": "bldg_science_5",
    "loc_teaching": "bldg_tr",
    "loc_lib": "bldg_lib_main",
    "loc_yiren": "bldg_yireng",
    "loc_dorm_boy9": "bldg_dorm_b9a",
    "loc_dorm_girl14": "bldg_dorm_g14",
    "loc_gym": "bldg_badminton",
    "loc_night_street": "bldg_street_night",
    "loc_backgate": "bldg_street_back",
    "loc_pine_restaurant": "bldg_res_core",
    "loc_bus_station": "bldg_bus_guard",
}


def resolve_building_id(location_id: str) -> str:
    """把模擬器的地點 id 轉成建築 id；已經是建築 id 時原樣回傳。"""
    return LEGACY_LOCATION_TO_BUILDING.get(location_id, location_id)


class RoadNetworkError(Exception):
    """路網或模型資料無法使用。"""


class RouteNotFoundError(Exception):
    """兩點之間找不到路徑。"""


@dataclass(frozen=True)
class BuildingBox:
    min_x: float
    max_x: float
    min_z: float
    max_z: float

    @property
    def center(self) -> tuple[float, float]:
        return ((self.min_x + self.max_x) / 2, (self.min_z + self.max_z) / 2)

    def distance_to(self, x: float, z: float) -> float:
        dx = max(self.min_x - x, 0.0, x - self.max_x)
        dz = max(self.min_z - z, 0.0, z - self.max_z)
        return math.hypot(dx, dz)


@dataclass(frozen=True)
class Access:
    """建築接入路網的位置：邊 edge 上，從 a 端算起的比例 t。"""

    edge: int
    t: float
    point: Point


def _quat_rotate(q: list[float], v: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z, w = q
    vx, vy, vz = v
    tx = 2 * (y * vz - z * vy)
    ty = 2 * (z * vx - x * vz)
    tz = 2 * (x * vy - y * vx)
    return (
        vx + w * tx + (y * tz - z * ty),
        vy + w * ty + (z * tx - x * tz),
        vz + w * tz + (x * ty - y * tx),
    )


def load_building_boxes(glb_path: Path) -> dict[str, BuildingBox]:
    """讀取 .glb，回傳每個命名物件在 Three.js 世界座標（含 CAMPUS_OFFSET）的 XZ 包圍盒。

    只處理根層級節點的 TRS（目前模型沒有階層）。
    """
    try:
        raw = glb_path.read_bytes()
    except OSError as exc:
        raise RoadNetworkError(f"找不到校園模型：{glb_path}") from exc
    if raw[:4] != b"glTF":
        raise RoadNetworkError("校園模型不是有效的 .glb 檔案")

    json_len = struct.unpack("<I", raw[12:16])[0]
    gltf = json.loads(raw[20 : 20 + json_len])

    boxes: dict[str, BuildingBox] = {}
    for node in gltf.get("nodes", []):
        name = node.get("name")
        mesh_idx = node.get("mesh")
        if not name or mesh_idx is None:
            continue
        t = node.get("translation", [0.0, 0.0, 0.0])
        s = node.get("scale", [1.0, 1.0, 1.0])
        q = node.get("rotation")

        xs: list[float] = []
        zs: list[float] = []
        for prim in gltf["meshes"][mesh_idx]["primitives"]:
            acc = gltf["accessors"][prim["attributes"]["POSITION"]]
            lo, hi = acc["min"], acc["max"]
            for cx in (lo[0], hi[0]):
                for cy in (lo[1], hi[1]):
                    for cz in (lo[2], hi[2]):
                        v = (cx * s[0], cy * s[1], cz * s[2])
                        if q:
                            v = _quat_rotate(q, v)
                        xs.append(v[0] + t[0] + CAMPUS_OFFSET[0])
                        zs.append(v[2] + t[2] + CAMPUS_OFFSET[2])
        if xs:
            boxes[name] = BuildingBox(min(xs), max(xs), min(zs), max(zs))
    return boxes


def _lerp(pa: Point, pb: Point, t: float) -> Point:
    return (
        pa[0] + (pb[0] - pa[0]) * t,
        pa[1] + (pb[1] - pa[1]) * t,
        pa[2] + (pb[2] - pa[2]) * t,
    )


class RoadNetwork:
    def __init__(
        self,
        nodes: list[Point],
        edges: list[tuple[int, int]],
        boxes: dict[str, BuildingBox],
    ) -> None:
        self.nodes = nodes
        self.edges = edges
        self.lengths = [math.dist(nodes[a], nodes[b]) for a, b in edges]
        self.adj: list[list[tuple[int, float]]] = [[] for _ in nodes]
        for (a, b), length in zip(edges, self.lengths, strict=True):
            self.adj[a].append((b, length))
            self.adj[b].append((a, length))
        self.boxes = boxes
        self.access: dict[str, Access] = {}
        for bid, box in boxes.items():
            acc = self._attach(box)
            if acc is not None:
                self.access[bid] = acc

    def _attach(self, box: BuildingBox) -> Access | None:
        """找出離建築包圍盒最近的路段上一點；距離相同時取離建築中心近者。"""
        cx, cz = box.center
        best_key: tuple[float, float] | None = None
        best: Access | None = None
        for idx, (a, b) in enumerate(self.edges):
            if self.lengths[idx] < 1e-6:
                continue
            pa, pb = self.nodes[a], self.nodes[b]

            def dist_at(t: float, pa: Point = pa, pb: Point = pb) -> float:
                p = _lerp(pa, pb, t)
                # 加上極小的「離中心距離」權重，讓同樣近的點中取離建築中心較近者
                return box.distance_to(p[0], p[2]) + 1e-3 * math.hypot(p[0] - cx, p[2] - cz)

            # 兩項皆為沿線段的凸函數，總和也是凸函數，可用三分搜尋找最小值
            lo, hi = 0.0, 1.0
            for _ in range(40):
                m1 = lo + (hi - lo) / 3
                m2 = hi - (hi - lo) / 3
                if dist_at(m1) <= dist_at(m2):
                    hi = m2
                else:
                    lo = m1
            t = (lo + hi) / 2
            pt = _lerp(pa, pb, t)
            key = (round(box.distance_to(pt[0], pt[2]), 2), math.hypot(pt[0] - cx, pt[2] - cz))
            if best_key is None or key < best_key:
                best_key = key
                best = Access(idx, t, pt)
        return best

    def route(self, from_id: str, to_id: str) -> tuple[float, list[Point]]:
        """回傳 (總長度, 路徑座標)。建築無法接入路網時拋出 KeyError(building_id)。"""
        src = self.access.get(resolve_building_id(from_id))
        if src is None:
            raise KeyError(from_id)
        dst = self.access.get(resolve_building_id(to_id))
        if dst is None:
            raise KeyError(to_id)

        # 同一條邊：直接走
        if src.edge == dst.edge:
            return abs(src.t - dst.t) * self.lengths[src.edge], [src.point, dst.point]

        dist = [math.inf] * len(self.nodes)
        prev: list[int | None] = [None] * len(self.nodes)
        heap: list[tuple[float, int]] = []
        sa, sb = self.edges[src.edge]
        sl = self.lengths[src.edge]
        for node, d in ((sa, src.t * sl), (sb, (1 - src.t) * sl)):
            if d < dist[node]:
                dist[node] = d
                heapq.heappush(heap, (d, node))

        while heap:
            d, u = heapq.heappop(heap)
            if d > dist[u]:
                continue
            for v, w in self.adj[u]:
                nd = d + w
                if nd < dist[v]:
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(heap, (nd, v))

        ta, tb = self.edges[dst.edge]
        tl = self.lengths[dst.edge]
        total, end = min((dist[ta] + dst.t * tl, ta), (dist[tb] + (1 - dst.t) * tl, tb))
        if math.isinf(total):
            raise RouteNotFoundError(f"{from_id} 與 {to_id} 之間沒有可通行的路")

        chain = [end]
        while (parent := prev[chain[-1]]) is not None:
            chain.append(parent)
        chain.reverse()
        return total, [src.point, *(self.nodes[i] for i in chain), dst.point]


def build_network(road_path: Path, glb_path: Path) -> RoadNetwork:
    try:
        data = json.loads(road_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RoadNetworkError(f"無法讀取路網資料：{road_path}") from exc

    nodes_raw = sorted(data["nodes"], key=lambda n: n["id"])
    nodes: list[Point] = [(n["x"], n["y"], n["z"]) for n in nodes_raw]
    edges = [(e["a"], e["b"]) for e in data["edges"]]
    return RoadNetwork(nodes, edges, load_building_boxes(glb_path))


@lru_cache(maxsize=1)
def get_network() -> RoadNetwork:
    return build_network(settings.ROAD_NETWORK_PATH, settings.CAMPUS_MODEL_PATH)
