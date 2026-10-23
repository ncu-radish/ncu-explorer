from typing import Any

from pydantic import BaseModel

from app.schemas.llm import TurnGenerationSchema


class SimStartRequest(BaseModel):
    user_input: str

class ScheduleSlot(BaseModel):
    day: int  # 1~7
    slot: str  # morning, afternoon, evening
    title: str
    type: str  # course, club, free
    location_id: str | None = None
    location_name: str | None = None
    course_id: str | None = None
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
