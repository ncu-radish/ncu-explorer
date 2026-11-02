from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
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
    english_name = Column(String(100), nullable=True)
    type = Column(String(30), nullable=False, index=True)  # academic_club, recreation_club, etc.
    category = Column(String(50), nullable=True, index=True)  # 聯誼性, 學術性, 康樂性, 系學會, 體育性, 服務性
    day_of_week = Column(Integer, nullable=False, default=2)  # 1~7
    period_slot = Column(String(20), nullable=False, default="evening")  # morning, afternoon, evening
    location_id = Column(String(50), ForeignKey("campus_locations.id"), nullable=True)
    location_text = Column(String(100), nullable=True)  # 社辦地點
    website_url = Column(String(500), nullable=True)  # 社團網站
    image_url = Column(String(500), nullable=True)  # 社團圖片
    prompt_context = Column(Text, nullable=False)
    full_intro = Column(Text, nullable=False)
    english_intro = Column(Text, nullable=True)

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

    @property
    def content_html(self) -> str:
        # Keep DB column stable while exposing HTML-focused field name.
        return self.content_md

    @content_html.setter
    def content_html(self, value: str) -> None:
        self.content_md = value

    location = relationship("CampusLocation", back_populates="life_infos")


class RandomEvent(Base):
    __tablename__ = "random_events"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    weight = Column(Integer, default=10, nullable=False)
    trigger_rate = Column(Float, default=0.5, nullable=False)  # 專屬獨立觸發機率 (0.0 ~ 1.0)
    cond_days = Column(JSON, nullable=True)  # [1, 2, 3, 4, 5]
    cond_slots = Column(JSON, nullable=True)  # ["morning", "afternoon", "evening"]
    cond_time_start = Column(String(10), nullable=True)  # e.g. "12:00"
    cond_time_end = Column(String(10), nullable=True)  # e.g. "13:30"
    cond_activity_type = Column(String(50), nullable=True)  # e.g. "course", "club", "dining", "dorm", "leisure"
    cond_activity_title = Column(String(100), nullable=True)  # 當前活動名稱關鍵字, e.g. "微積分"
    cond_prev_activity = Column(String(100), nullable=True)  # 先前活動或歷史行程關鍵字, e.g. "體育"
    cond_prev_event_id = Column(String(50), nullable=True)  # 先前曾觸發的突發事件 ID
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


class Building(Base):
    __tablename__ = "buildings"

    id = Column(String(50), primary_key=True, index=True)
    name_zh = Column(String(100), nullable=False, index=True)
    name_en = Column(String(100), nullable=True, index=True)
    category = Column(String(50), nullable=True, index=True)
    classroom_code = Column(String(20), nullable=True, index=True)
    departments = Column(JSON, nullable=True)  # List[str]
    alias = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)


class CampusActivity(Base):
    __tablename__ = "campus_activities"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # breakfast, lunch, dinner, dorm_leisure, campus_leisure
    trigger_type = Column(String(50), nullable=False, default="time_slot")  # time_slot, class_break, free_time
    trigger_timing = Column(String(100), nullable=False, default="12:00~13:30")  # e.g. "07:00~09:00", "12:00~13:30", "17:30~19:30", "下課空閒時間"
    trigger_mode = Column(String(50), nullable=False, default="manual_choice")  # manual_choice (主動選擇是否進行), auto_prompt (時段推薦), conditional (條件觸發)
    location_id = Column(String(50), ForeignKey("campus_locations.id"), nullable=True)
    location_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    weight = Column(Integer, default=10, nullable=False)
    event_prompt = Column(Text, nullable=False)
    preset_options = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
