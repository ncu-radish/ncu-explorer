from typing import Any

from pydantic import BaseModel

from app.schemas.llm import TurnGenerationSchema


class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str

class SystemConfigDTO(BaseModel):
    active_llm_model: str
    event_trigger_prob: float
    system_prompt_override: str | None = None

class SystemConfigUpdate(BaseModel):
    active_llm_model: str | None = None
    event_trigger_prob: float | None = None
    system_prompt_override: str | None = None

class DashboardMetricsResponse(BaseModel):
    total_sessions: int
    popular_departments: list[dict[str, Any]]
    popular_clubs: list[dict[str, Any]]
    active_model: str
    event_trigger_prob: float
    available_models: list[dict[str, str]]
    total_courses: int
    synced_courses: int

class RandomEventDTO(BaseModel):
    id: str
    title: str
    is_active: bool
    weight: int
    trigger_rate: float = 0.5
    cond_days: list[int] | None = None
    cond_slots: list[str] | None = None
    cond_time_start: str | None = None
    cond_time_end: str | None = None
    cond_activity_type: str | None = None
    cond_activity_title: str | None = None
    cond_prev_activity: str | None = None
    cond_prev_event_id: str | None = None
    cond_location: str | None = None
    cond_min_stamina: int
    cond_max_stamina: int
    event_prompt: str
    preset_options: list[dict[str, Any]]

    class Config:
        from_attributes = True

class RandomEventCreate(BaseModel):
    id: str
    title: str
    is_active: bool = True
    weight: int = 10
    trigger_rate: float = 0.5
    cond_days: list[int] | None = None
    cond_slots: list[str] | None = None
    cond_time_start: str | None = None
    cond_time_end: str | None = None
    cond_activity_type: str | None = None
    cond_activity_title: str | None = None
    cond_prev_activity: str | None = None
    cond_prev_event_id: str | None = None
    cond_location: str | None = None
    cond_min_stamina: int = 0
    cond_max_stamina: int = 100
    event_prompt: str
    preset_options: list[dict[str, Any]]

class RandomEventUpdate(BaseModel):
    title: str | None = None
    is_active: bool | None = None
    weight: int | None = None
    trigger_rate: float | None = None
    cond_days: list[int] | None = None
    cond_slots: list[str] | None = None
    cond_time_start: str | None = None
    cond_time_end: str | None = None
    cond_activity_type: str | None = None
    cond_activity_title: str | None = None
    cond_prev_activity: str | None = None
    cond_prev_event_id: str | None = None
    cond_location: str | None = None
    cond_min_stamina: int | None = None
    cond_max_stamina: int | None = None
    event_prompt: str | None = None
    preset_options: list[dict[str, Any]] | None = None

class SandboxTestRequest(BaseModel):
    event_prompt: str
    preset_options: list[dict[str, Any]]
    location_id: str | None = "loc_park_creek"
    slot: str | None = "morning"

class SandboxTestResponse(BaseModel):
    generated_story: TurnGenerationSchema


class CampusActivityDTO(BaseModel):
    id: str
    title: str
    category: str
    trigger_type: str
    trigger_timing: str
    trigger_mode: str
    location_id: str | None = None
    location_name: str | None = None
    is_active: bool
    weight: int
    event_prompt: str
    preset_options: list[dict[str, Any]]

    class Config:
        from_attributes = True


class CampusActivityCreate(BaseModel):
    id: str
    title: str
    category: str  # breakfast, lunch, dinner, dorm_leisure, campus_leisure
    trigger_type: str = "time_slot"  # time_slot, class_break, free_time
    trigger_timing: str = "12:00~13:30"
    trigger_mode: str = "manual_choice"  # manual_choice, auto_prompt, conditional
    location_id: str | None = None
    location_name: str | None = None
    is_active: bool = True
    weight: int = 10
    event_prompt: str
    preset_options: list[dict[str, Any]]


class CampusActivityUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    trigger_type: str | None = None
    trigger_timing: str | None = None
    trigger_mode: str | None = None
    location_id: str | None = None
    location_name: str | None = None
    is_active: bool | None = None
    weight: int | None = None
    event_prompt: str | None = None
    preset_options: list[dict[str, Any]] | None = None
