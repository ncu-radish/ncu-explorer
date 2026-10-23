"""
NCU Course Vector & Recommendation Service
==========================================
負責全校課程語意向量檢索 (ChromaDB + FastEmbed)、學系與領域推薦、
以及管理介面的 3D 向量星系投影 (3D Vector Universe)。
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.llm_client import call_ollama_structured
from app.services.course_db import course_db_service, resolve_courses_db_path

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
TMP_DATA_DIR = PROJECT_ROOT / "tmp" / "data"


def resolve_chroma_path() -> Optional[Path]:
    backend_p = BACKEND_DATA_DIR / "chroma_db"
    if backend_p.exists():
        return backend_p
    tmp_p = TMP_DATA_DIR / "chroma_db"
    if tmp_p.exists():
        return tmp_p
    return None


def resolve_umap_cache_path() -> Optional[Path]:
    backend_p = BACKEND_DATA_DIR / "umap_3d_cache.json"
    if backend_p.exists():
        return backend_p
    tmp_p = TMP_DATA_DIR / "umap_3d_cache.json"
    if tmp_p.exists():
        return tmp_p
    return None


def resolve_umap_model_path() -> Optional[Path]:
    backend_p = BACKEND_DATA_DIR / "umap_3d_model.joblib"
    if backend_p.exists():
        return backend_p
    tmp_p = TMP_DATA_DIR / "umap_3d_model.joblib"
    if tmp_p.exists():
        return tmp_p
    return None


class CourseVectorService:
    def __init__(self):
        self._client = None
        self._collection = None
        self._embedder = None
        self._cached_3d_data = None
        self._umap_model = None

    @property
    def embedder(self):
        if self._embedder is None:
            from fastembed import TextEmbedding
            # 與向量庫使用的模型保持一致 (BAAI/bge-small-zh-v1.5)
            self._embedder = TextEmbedding(model_name="BAAI/bge-small-zh-v1.5")
        return self._embedder

    @property
    def collection(self):
        if self._collection is None:
            import chromadb
            chroma_dir = resolve_chroma_path()
            if not chroma_dir:
                raise FileNotFoundError("找不到 chroma_db 向量資料庫目錄！")
            self._client = chromadb.PersistentClient(path=str(chroma_dir))
            self._collection = self._client.get_collection("ncu_courses")
        return self._collection

    def embed_text(self, text: str) -> List[float]:
        """計算查詢字串之向量"""
        vectors = list(self.embedder.embed([text.strip()]))
        return vectors[0].tolist()

    def semantic_search(
        self,
        query: str,
        semester: Optional[str] = None,
        department: Optional[str] = None,
        degree: Optional[str] = None,
        top_k: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        模糊語意檢索：透過向量資料庫查詢語意關聯度最高之課程。
        回傳計算出的匹配度百分比 (Match %) 與詳細課綱、時段教室。
        """
        if not query or not query.strip():
            return []

        q_vec = self.embed_text(query)

        # 構建 ChromaDB Where 過濾器
        where_conds = []
        if semester and semester.strip():
            where_conds.append({"semester": {"$eq": semester.strip()}})
        if department and department.strip():
            where_conds.append({"department": {"$eq": department.strip()}})
        if degree and degree.strip():
            where_conds.append({"degree": {"$eq": degree.strip()}})

        where_filter = None
        if len(where_conds) == 1:
            where_filter = where_conds[0]
        elif len(where_conds) > 1:
            where_filter = {"$and": where_conds}

        # 檢索
        results = self.collection.query(
            query_embeddings=[q_vec],
            n_results=min(top_k * 2, 80),
            where=where_filter,
            include=["metadatas", "documents", "distances"],
        )

        matched_items: List[Dict[str, Any]] = []
        if not results or not results["ids"] or len(results["ids"][0]) == 0:
            return []

        ids = results["ids"][0]
        metas = results["metadatas"][0]
        docs = results["documents"][0]
        distances = results["distances"][0]

        for i in range(len(ids)):
            doc_id = ids[i]
            meta = metas[i] or {}
            doc_text = docs[i] or ""
            dist = float(distances[i])

            # Chroma 距離轉換為 0 ~ 100% 相似度
            similarity = max(0.0, min(100.0, round((1.0 - dist) * 100, 1)))

            # 拆解 semester 與 serial_no
            sem = meta.get("semester", "")
            serial = meta.get("serial_no", "")
            if not sem or not serial:
                parts = doc_id.split("_")
                if len(parts) >= 2:
                    sem, serial = parts[0], parts[1]

            item = {
                "id": doc_id,
                "semester": sem,
                "serial_no": serial,
                "course_code": meta.get("course_code", ""),
                "course_name_zh": meta.get("course_name_zh", ""),
                "course_name_en": meta.get("course_name_en", ""),
                "department": meta.get("department", ""),
                "teacher": meta.get("teacher", ""),
                "credits": float(meta.get("credits", 0.0)),
                "degree": meta.get("degree", ""),
                "similarity": similarity,
                "distance": dist,
                "preview": (doc_text[:180] + "...") if len(doc_text) > 180 else doc_text,
            }
            matched_items.append(item)

        # 排序並截取 top_k
        matched_items.sort(key=lambda x: x["similarity"], reverse=True)
        top_items = matched_items[:top_k]

        # 透過 SQLite 補全 schedules
        conn = course_db_service.get_connection()
        cursor = conn.cursor()
        for it in top_items:
            cursor.execute(
                "SELECT time, location FROM schedules WHERE semester = ? AND serial_no = ?",
                [it["semester"], it["serial_no"]],
            )
            it["schedules"] = [dict(r) for r in cursor.fetchall()]

            cursor.execute(
                "SELECT objectives, content, fields, textbooks FROM courses WHERE semester = ? AND serial_no = ?",
                [it["semester"], it["serial_no"]],
            )
            crow = cursor.fetchone()
            if crow:
                it["objectives"] = crow["objectives"] or ""
                it["content"] = crow["content"] or ""
                it["fields"] = crow["fields"] or ""
                it["textbooks"] = crow["textbooks"] or ""
        conn.close()

        return top_items

    async def recommend_departments(
        self,
        interest_query: str,
        semester: Optional[str] = None,
        top_departments_count: int = 5,
        courses_per_dept: int = 4,
    ) -> Dict[str, Any]:
        """
        學系推薦：輸入有興趣的領域或是課程，
        由向量庫全域檢索後，聚類推薦契合度最高之學系與核心課程，
        並輔以智慧選課顧問之綜合學習脈絡引導。
        """
        raw_matches = self.semantic_search(
            query=interest_query,
            semester=semester,
            top_k=80,
        )

        if not raw_matches:
            return {
                "query": interest_query,
                "departments": [],
                "top_courses": [],
                "consultant_advice": "查無足夠相符之課程，請嘗試輸入更具體的興趣關鍵字（例如：人工智慧、永續能源、金融科技、日語會話）。",
            }

        # 依系所分組並計算關聯分數
        dept_groups: Dict[str, List[Dict[str, Any]]] = {}
        for c in raw_matches:
            d = c.get("department") or "其他單位"
            if d not in dept_groups:
                dept_groups[d] = []
            dept_groups[d].append(c)

        ranked_depts = []
        for dept_name, courses in dept_groups.items():
            # 計算該系前幾門課程之加權平均相符度
            top_sims = [c["similarity"] for c in courses[:courses_per_dept]]
            avg_score = round(sum(top_sims) / len(top_sims), 1)
            max_score = max(top_sims)
            ranked_depts.append({
                "department": dept_name,
                "match_score": max_score,
                "avg_score": avg_score,
                "course_count": len(courses),
                "featured_courses": courses[:courses_per_dept],
            })

        # 按分數排序並取前 N 個系所
        ranked_depts.sort(key=lambda x: (x["match_score"], x["avg_score"]), reverse=True)
        top_depts = ranked_depts[:top_departments_count]

        # 收集關聯度最高的課程總清單
        all_top_courses = raw_matches[:12]

        # 生成顧問導讀
        dept_bullets = []
        for d in top_depts:
            cnames = [f"《{c['course_name_zh']}》" for c in d["featured_courses"][:3]]
            dept_bullets.append(f"- 【{d['department']}】（契合度 {d['match_score']}%）：包含 {', '.join(cnames)}")

        dept_summary_text = "\n".join(dept_bullets)
        fallback_advice = (
            f"根據你對「{interest_query}」的學習興趣，中央大學最推薦探索的系所為："
            f"{'、'.join([d['department'] for d in top_depts[:3]])}。\n\n"
            f"各系所提供的精選課程涵蓋了基礎原理至前沿實務應用，建議可先從高相符度的基礎核心必修或跨領域選修入門，"
            f"循序漸進建立扎實的專業能力與技能樹！"
        )

        return {
            "query": interest_query,
            "departments": top_depts,
            "top_courses": all_top_courses,
            "consultant_advice": fallback_advice,
        }

    def get_3d_universe_data(self) -> Dict[str, Any]:
        """取得管理介面 3D 向量星系投影之所有課程座標與全域統計"""
        if self._cached_3d_data is not None:
            return self._cached_3d_data

        cache_path = resolve_umap_cache_path()
        if cache_path and cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                points = data.get("points", [])
                self._cached_3d_data = {
                    "total": len(points),
                    "algorithm": "UMAP 3D Manifold Learning",
                    "metric": "cosine",
                    "n_neighbors": 15,
                    "min_dist": 0.1,
                    "points": points,
                }
                return self._cached_3d_data
            except Exception as e:
                logger.error(f"讀取 3D 快取失敗: {e}")

        # 若無快取，回傳空
        return {
            "total": 0,
            "algorithm": "UMAP 3D",
            "metric": "cosine",
            "points": [],
        }

    def project_query_3d(
        self,
        query: str,
        top_k: int = 5,
        semester: Optional[str] = None,
        department: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        將即時查詢字串投影至 3D 空間，並尋找鄰近連線課程。
        若有 umap_3d_model.joblib 則使用 UMAP transform，
        否則使用 Top-K 鄰近節點加權質心投影。
        """
        universe = self.get_3d_universe_data()
        points = universe.get("points", [])
        if not points:
            return {"query": query, "coord": [0.0, 0.0, 0.0], "nearest_courses": []}

        # 1. 向量搜尋 Top-K 課程
        matches = self.semantic_search(
            query=query,
            semester=semester,
            department=department,
            top_k=top_k,
        )

        points_map = {p["id"]: p for p in points}

        nearest_courses: List[Dict[str, Any]] = []
        for m in matches:
            cid = m["id"]
            if cid in points_map:
                pt = points_map[cid]
                nearest_courses.append({
                    "id": cid,
                    "name": m["course_name_zh"],
                    "dept": m["department"],
                    "teacher": m["teacher"],
                    "similarity": m["similarity"],
                    "distance": m["distance"],
                    "x": pt["x"],
                    "y": pt["y"],
                    "z": pt["z"],
                })

        # 2. 計算查詢之 3D 座標
        query_coord = None
        # 嘗試使用已訓練好的 UMAP 模型
        try:
            import joblib
            model_path = resolve_umap_model_path()
            if model_path and model_path.exists():
                if self._umap_model is None:
                    self._umap_model = joblib.load(model_path)
                q_vec = np.array([self.embed_text(query)])
                c3d = self._umap_model.transform(q_vec)[0]
                query_coord = [round(float(c3d[0]), 4), round(float(c3d[1]), 4), round(float(c3d[2]), 4)]
        except Exception as err:
            logger.warning(f"UMAP transform 失敗，改用加權質心: {err}")

        # Fallback: 加權質心投影
        if query_coord is None and nearest_courses:
            weights = [max(0.01, 100.0 - c["distance"] * 100.0) for c in nearest_courses]
            total_w = sum(weights) or 1.0
            wx = sum(c["x"] * w for c, w in zip(nearest_courses, weights)) / total_w
            wy = sum(c["y"] * w for c, w in zip(nearest_courses, weights)) / total_w
            wz = sum(c["z"] * w for c, w in zip(nearest_courses, weights)) / total_w
            query_coord = [round(float(wx), 4), round(float(wy), 4), round(float(wz), 4)]
        elif query_coord is None:
            query_coord = [0.0, 0.0, 0.0]

        return {
            "query": query,
            "coord": query_coord,
            "nearest_courses": nearest_courses,
        }


course_vector_service = CourseVectorService()
