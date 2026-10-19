import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "NCU Life Simulator & Explorer API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # SQLite
    DATA_DIR: Path = BASE_DIR / "data"
    SQLITE_DB_PATH: Path = DATA_DIR / "ncu_sim.sqlite"
    DATABASE_URL: str = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"

    # Qdrant Vector DB
    QDRANT_STORAGE_PATH: Path = DATA_DIR / "qdrant_storage"
    QDRANT_COLLECTION_NAME: str = "ncu_courses_hybrid"

    # Ollama LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_LLM_MODEL: str = "gemma3:4b"
    EVENT_TRIGGER_PROB: float = 0.35

    # JWT Security
    SECRET_KEY: str = "ncu-secret-key-simulator-2026-production-token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.QDRANT_STORAGE_PATH, exist_ok=True)
