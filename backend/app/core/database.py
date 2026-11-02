from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# SQLite configuration with check_same_thread=False for FastAPI concurrency
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def migrate_database_schema(target_engine=engine):
    """
    Ensure newly added columns exist in SQLite database without needing external migration tools.
    """
    from sqlalchemy import inspect, text
    try:
        with target_engine.connect() as conn:
            inspector = inspect(conn)
            if "random_events" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("random_events")]
                new_columns = [
                    ("trigger_rate", "FLOAT DEFAULT 0.5"),
                    ("cond_time_start", "VARCHAR(10)"),
                    ("cond_time_end", "VARCHAR(10)"),
                    ("cond_activity_type", "VARCHAR(50)"),
                    ("cond_activity_title", "VARCHAR(100)"),
                    ("cond_prev_activity", "VARCHAR(100)"),
                    ("cond_prev_event_id", "VARCHAR(50)"),
                ]
                for col_name, col_type in new_columns:
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE random_events ADD COLUMN {col_name} {col_type}"))
                conn.commit()
    except Exception as e:
        print(f"[DB Migration Warning] {e}")


# Run lightweight migration on import
migrate_database_schema()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

