from typing import Any

from pydantic import BaseModel

from app.schemas.llm import TurnGenerationSchema


class SimStartRequest(BaseModel):
    user_input: str
    department: str | None = None
    grade: int | None = None

class ScheduleSlot(BaseModel):
    day: int  # 1~5 (週一至週五)
    slot: str  # slot_1 ~ slot_6
    title: str
    type: str  # course, club, lunch, free
    location_id: str | None = None
    location_name: str | None = None
    course_id: str | None = None
    course_code: str | None = None
    course_category: str | None = None  # 必修, 選修, 通識, 體育, 語言選修
    credits: float | None = None
    instructor: str | None = None
    raw_schedule: str | None = None
    time_label: str | None = None
    periods: list[str] | None = None
    club_id: str | None = None

class SimStartResponse(BaseModel):
    session_id: str
    player_profile: dict[str, Any]
    weekly_schedule: list[ScheduleSlot]
    current_turn: int
    stats: dict[str, int]
    current_story: TurnGenerationSchema
    current_location_id: str | None = None
    current_location_name: str | None = None

class SimNextTurnRequest(BaseModel):
    session_id: str
    option_key: str  # A, B, or C

class SimNextTurnResponse(BaseModel):
    session_id: str
    current_turn: int
    is_game_over: bool
    stats: dict[str, int]
    delta_stats: dict[str, int]
    story: TurnGenerationSchema | None = None
    current_location_id: str | None = None
    current_location_name: str | None = None

class SimSummaryRequest(BaseModel):
    session_id: str

class SimSummaryResponse(BaseModel):
    session_id: str
    title: str
    summary_diary: str
    final_stats: dict[str, int]
    visited_locations: list[dict[str, Any]]
    enrolled_courses: list[dict[str, Any]]
    total_credits: float | None = None
