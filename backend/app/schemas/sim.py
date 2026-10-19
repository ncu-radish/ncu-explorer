from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.llm import TurnGenerationSchema

class SimStartRequest(BaseModel):
    user_input: str

class ScheduleSlot(BaseModel):
    day: int  # 1~7
    slot: str  # morning, afternoon, evening
    title: str
    type: str  # course, club, free
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    course_id: Optional[str] = None
    club_id: Optional[str] = None

class SimStartResponse(BaseModel):
    session_id: str
    player_profile: Dict[str, Any]
    weekly_schedule: List[ScheduleSlot]
    current_turn: int
    stats: Dict[str, int]
    current_story: TurnGenerationSchema
    current_location_id: Optional[str] = None
    current_location_name: Optional[str] = None

class SimNextTurnRequest(BaseModel):
    session_id: str
    option_key: str  # A, B, or C

class SimNextTurnResponse(BaseModel):
    session_id: str
    current_turn: int
    is_game_over: bool
    stats: Dict[str, int]
    delta_stats: Dict[str, int]
    story: Optional[TurnGenerationSchema] = None
    current_location_id: Optional[str] = None
    current_location_name: Optional[str] = None

class SimSummaryRequest(BaseModel):
    session_id: str

class SimSummaryResponse(BaseModel):
    session_id: str
    title: str
    summary_diary: str
    final_stats: Dict[str, int]
    visited_locations: List[Dict[str, Any]]
    enrolled_courses: List[Dict[str, Any]]
