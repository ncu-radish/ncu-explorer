from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.courses import router as courses_router
from app.api.explore import router as explore_router
from app.api.roadmap import router as roadmap_router  # [新增: Future Map 夢想導航路由]
from app.api.sim import router as sim_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="國立中央大學智慧校園生活模擬與 AI 課程探索平台後端 API",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(sim_router, prefix=settings.API_V1_STR)
app.include_router(courses_router, prefix=settings.API_V1_STR)
app.include_router(explore_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(roadmap_router, prefix=settings.API_V1_STR)  # [新增: Future Map 夢想導航路由]

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "SQLite (Local)",
        "vector_db": "Qdrant (Local Persistence Mode)",
        "embedding_engine": "FastEmbed (Local ONNX)",
    }

@app.get("/")
def root():
    return {
        "message": "歡迎使用 NCU Life Simulator & Explorer API 服務",
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health",
    }
