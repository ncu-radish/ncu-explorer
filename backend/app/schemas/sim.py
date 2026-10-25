from typing import Any

from pydantic import BaseModel

from app.schemas.llm import TurnGenerationSchema


class SimStartRequest(BaseModel):
    user_input: str
    department: str | None = None
    grade: int | None = None

class ScheduleSlot(BaseModel):
    day: int  # 1~5 (週一至週五)
    slot: str  # slot identifier or time key
    title: str
    type: str  # course, club, lunch, dorm, free
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
    start_time: str | None = None  # e.g. "10:00"
    end_time: str | None = None  # e.g. "12:50"
    display_time: str | None = None  # e.g. "10:00 ~ 12:50"

class SimStartResponse(BaseModel):
    session_id: str
    player_profile: dict[str, Any]
    weekly_schedule: list[ScheduleSlot]
    current_turn: int
    current_time: str | None = "08:00"
    current_day: int | None = 1
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
    current_time: str | None = None
    current_day: int | None = None
    is_game_over: bool
    stats: dict[str, int]
    delta_stats: dict[str, int]
    story: TurnGenerationSchema | None = None
    current_location_id: str | None = None
    current_location_name: str | None = None
    weekly_schedule: list[ScheduleSlot] | None = None


class SimTriggerActivityRequest(BaseModel):
    session_id: str
    activity_id: str  # e.g., act_lunch, act_breakfast, act_dorm_leisure, act_campus_leisure
    option_key: str = "A"  # A, B, or C
    duration_hours: float = 1.0  # Flexible hours e.g. 1.5, 2.0
    duration_minutes: int | None = None  # Flexible minutes e.g. 45, 90, 120
    custom_end_time: str | None = None  # e.g. '22:30'
    custom_title: str | None = None


class SimTriggerActivityResponse(BaseModel):
    session_id: str
    message: str
    marked_slot: ScheduleSlot | None = None
    weekly_schedule: list[ScheduleSlot]
    current_turn: int | None = None
    current_time: str | None = None
    current_day: int | None = None
    stats: dict[str, int]
    delta_stats: dict[str, int]
    story: TurnGenerationSchema | None = None
    is_game_over: bool = False
    current_location_id: str | None = None
    current_location_name: str | None = None


class SimPrePlanRequest(BaseModel):
    session_id: str
    target_day: int
    slots: list[dict[str, Any]] = []
    sleep_time: str | None = "22:00"
    alarm_time: str | None = "07:30"


class SimPrePlanResponse(BaseModel):
    session_id: str
    message: str
    current_turn: int
    current_time: str | None = None
    current_day: int | None = None
    weekly_schedule: list[ScheduleSlot]
    stats: dict[str, int]
    delta_stats: dict[str, int] | None = None
    sleep_hours: float | None = None
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
