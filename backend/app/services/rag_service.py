import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient, models
from fastembed import TextEmbedding, SparseTextEmbedding
from app.core.config import settings

logger = logging.getLogger(__name__)

class CourseRAGService:
    def __init__(self):
        self.client = QdrantClient(path=str(settings.QDRANT_STORAGE_PATH))
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.dense_model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        self.sparse_model_name = "Qdrant/bm25"
        self._dense_model = None
        self._sparse_model = None
        self._ensure_collection()

    @property
    def dense_model(self) -> TextEmbedding:
        if self._dense_model is None:
            self._dense_model = TextEmbedding(model_name=self.dense_model_name)
        return self._dense_model

    @property
    def sparse_model(self) -> SparseTextEmbedding:
        if self._sparse_model is None:
            self._sparse_model = SparseTextEmbedding(model_name=self.sparse_model_name)
        return self._sparse_model

    def _ensure_collection(self):
        collections = [col.name for col in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": models.VectorParams(
                        size=384,
                        distance=models.Distance.COSINE
                    )
                },
                sparse_vectors_config={
                    "bm25": models.SparseVectorParams(
                        index=models.SparseIndexParams(on_disk=False)
                    )
                }
            )
            logger.info(f"Created Qdrant hybrid collection: {self.collection_name}")

    def build_document_text(self, course_dict: Dict[str, Any]) -> str:
        return (
            f"passage: 【開課系所】{course_dict.get('department', '')} "
            f"【課程名稱】{course_dict.get('course_name', '')} "
            f"【必選修】{course_dict.get('grade', 0)}年級{course_dict.get('category', '')} "
            f"【課程大綱与目標】{course_dict.get('syllabus_summary', '')}"
        )

    def sync_courses_to_qdrant(self, courses: List[Dict[str, Any]]) -> int:
        if not courses:
            return 0

        texts = [self.build_document_text(c) for c in courses]

        # Compute dense embeddings
        dense_embeddings = list(self.dense_model.embed(texts))
        # Compute sparse embeddings
        sparse_embeddings = list(self.sparse_model.embed(texts))

        points = []
        for idx, course in enumerate(courses):
            sparse_vector = sparse_embeddings[idx]
            # Convert SparseEmbedding to Qdrant models.SparseVector
            sparse_dict = models.SparseVector(
                indices=sparse_vector.indices.tolist() if hasattr(sparse_vector.indices, "tolist") else list(sparse_vector.indices),
                values=sparse_vector.values.tolist() if hasattr(sparse_vector.values, "tolist") else list(sparse_vector.values)
            )

            point = models.PointStruct(
                id=hash(course["id"]) % (10**12),
                vector={
                    "dense": dense_embeddings[idx].tolist(),
                    "bm25": sparse_dict,
                },
                payload={
                    "course_id": course["id"],
                    "course_name": course["course_name"],
                    "department": course["department"],
                    "grade": course["grade"],
                    "semester_term": course["semester_term"],
                    "category": course["category"],
                    "day_of_week": course["day_of_week"],
                    "period_slot": course["period_slot"],
                    "location_id": course.get("location_id"),
                    "syllabus_summary": course["syllabus_summary"],
                    "credits": course.get("credits", 3),
                    "instructor": course.get("instructor", ""),
                    "raw_schedule": course.get("raw_schedule", "")
                }
            )
            points.append(point)

        self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info(f"Successfully synced {len(points)} courses to Qdrant hybrid index.")
        return len(points)

    def hybrid_search_courses(
        self,
        query: str,
        limit: int = 6,
        dept_filter: Optional[str] = None,
        grade_filter: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        # Format query for e5
        query_text = f"query: {query.strip()}"

        query_dense = list(self.dense_model.embed([query_text]))[0].tolist()
        query_sparse = list(self.sparse_model.embed([query.strip()]))[0]

        sparse_dict = models.SparseVector(
            indices=query_sparse.indices.tolist() if hasattr(query_sparse.indices, "tolist") else list(query_sparse.indices),
            values=query_sparse.values.tolist() if hasattr(query_sparse.values, "tolist") else list(query_sparse.values)
        )

        # Build payload filters
        must_filters = []
        if dept_filter:
            must_filters.append(models.FieldCondition(key="department", match=models.MatchValue(value=dept_filter)))
        if grade_filter and grade_filter > 0:
            must_filters.append(models.FieldCondition(key="grade", match=models.MatchValue(value=grade_filter)))

        query_filter = models.Filter(must=must_filters) if must_filters else None

        # Hybrid search using prefetch + RRF fusion in Qdrant
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                prefetch=[
                    models.Prefetch(
                        query=query_dense,
                        using="dense",
                        filter=query_filter,
                        limit=limit * 2
                    ),
                    models.Prefetch(
                        query=sparse_dict,
                        using="bm25",
                        filter=query_filter,
                        limit=limit * 2
                    )
                ],
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=limit
            )
            return [pt.payload for pt in results.points]
        except Exception as e:
            logger.warning(f"RRF query failed, falling back to dense vector search: {e}")
            # Fallback to pure dense search
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=("dense", query_dense),
                query_filter=query_filter,
                limit=limit
            )
            return [hit.payload for hit in results]

course_rag_service = CourseRAGService()
