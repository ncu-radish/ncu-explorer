import pytest

from app.services.course_db import BACKEND_DATA_DIR, resolve_courses_db_path
from app.services.mock_course_db import ensure_mock_courses_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_courses_db():
    """確保在沒有真實 courses.db 時，自動初始化輕量測試資料庫，使 CI 穩定通過"""
    if resolve_courses_db_path() is None:
        target = BACKEND_DATA_DIR / "courses.db"
        ensure_mock_courses_db(target)
