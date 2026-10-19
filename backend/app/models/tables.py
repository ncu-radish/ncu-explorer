from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CampusLocation(Base):
    __tablename__ = "campus_locations"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False, index=True)  # academic, dorm, dining, leisure, transport
    three_mesh_name = Column(String(100), unique=True, nullable=True)
    camera_pos = Column(JSON, nullable=True)  # {"pos": [x, y, z], "target": [x, y, z]}
    short_desc = Column(String(255), nullable=False)
    full_content = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)

    courses = relationship("Course", back_populates="location")
    activities = relationship("ClubAndActivity", back_populates="location")
    life_infos = relationship("CampusLifeInfo", back_populates="location")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(50), primary_key=True, index=True)  # e.g., 1141_IM1001_A
    semester = Column(String(10), nullable=False, index=True)
    department = Column(String(50), nullable=False, index=True)
    grade = Column(Integer, nullable=False, index=True)
    semester_term = Column(Integer, nullable=False, index=True)  # 1: 上學期, 2: 下學期
    course_name = Column(String(100), nullable=False, index=True)
    instructor = Column(String(50), nullable=False)
    category = Column(String(20), nullable=False, index=True)  # required, elective, general
    credits = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False, index=True)  # 1~5
    period_slot = Column(String(20), nullable=False, index=True)  # morning, afternoon, evening
    raw_schedule = Column(String(50), nullable=False)  # e.g., 二234
    location_id = Column(String(50), ForeignKey("campus_locations.id"), nullable=True)
    syllabus_summary = Column(Text, nullable=False)
    full_syllabus = Column(Text, nullable=True)
    is_synced_vec = Column(Boolean, default=False, nullable=False)

    location = relationship("CampusLocation", back_populates="courses")


class ClubAndActivity(Base):
    __tablename__ = "clubs_and_activities"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(30), nullable=False, index=True)  # academic_club, recreation_club, student_org, part_time
    day_of_week = Column(Integer, nullable=False)  # 1~7
    period_slot = Column(String(20), nullable=False)  # morning, afternoon, evening
    location_id = Column(String(50), ForeignKey("campus_locations.id"), nullable=True)
    prompt_context = Column(Text, nullable=False)
    full_intro = Column(Text, nullable=False)

    location = relationship("CampusLocation", back_populates="activities")


class CampusLifeInfo(Base):
    __tablename__ = "campus_life_info"

    id = Column(Integer, primary_key=True, autoincrement=True)
    info_type = Column(String(30), nullable=False, index=True)  # food, dorm_detail, transport
    title = Column(String(100), nullable=False)
    location_id = Column(String(50), ForeignKey("campus_locations.id"), nullable=True)
    tags = Column(JSON, nullable=False)  # e.g. ["早餐", "平價", "後門"]
    game_snippet = Column(String(255), nullable=False)
    content_md = Column(Text, nullable=False)

    location = relationship("CampusLocation", back_populates="life_infos")


class RandomEvent(Base):
    __tablename__ = "random_events"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    weight = Column(Integer, default=10, nullable=False)
    cond_days = Column(JSON, nullable=True)  # [1, 2, 3, 4, 5]
    cond_slots = Column(JSON, nullable=True)  # ["morning"]
    cond_location = Column(String(50), ForeignKey("campus_locations.id"), nullable=True)
    cond_min_stamina = Column(Integer, default=0, nullable=False)
    cond_max_stamina = Column(Integer, default=100, nullable=False)
    event_prompt = Column(Text, nullable=False)
    preset_options = Column(JSON, nullable=False)


class GameSession(Base):
    __tablename__ = "game_sessions"

    session_id = Column(String(36), primary_key=True, index=True)
    player_profile = Column(JSON, nullable=False)
    weekly_schedule = Column(JSON, nullable=False)
    current_turn = Column(Integer, default=0, nullable=False)  # 0~20
    stats = Column(JSON, nullable=False)  # {"stamina": 80, "study": 50, "social": 50, "money": 1500}
    visited_locs = Column(JSON, nullable=False)  # ["loc_mgt2", ...]
    triggered_evts = Column(JSON, nullable=False)  # ["evt_squirrel_attack", ...]
    history_logs = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="admin", nullable=False)


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    active_llm_model = Column(String(50), default="gemma3:4b", nullable=False)
    event_trigger_prob = Column(Float, default=0.35, nullable=False)
    system_prompt_override = Column(Text, nullable=True)
