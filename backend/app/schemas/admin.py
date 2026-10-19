from typing import List, Dict, Any, Optional
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
    system_prompt_override: Optional[str] = None

class SystemConfigUpdate(BaseModel):
    active_llm_model: Optional[str] = None
    event_trigger_prob: Optional[float] = None
    system_prompt_override: Optional[str] = None

class DashboardMetricsResponse(BaseModel):
    total_sessions: int
    popular_departments: List[Dict[str, Any]]
    popular_clubs: List[Dict[str, Any]]
    active_model: str
    event_trigger_prob: float
    available_models: List[Dict[str, str]]
    total_courses: int
    synced_courses: int

class RandomEventDTO(BaseModel):
    id: str
    title: str
    is_active: bool
    weight: int
    cond_days: Optional[List[int]] = None
    cond_slots: Optional[List[str]] = None
    cond_location: Optional[str] = None
    cond_min_stamina: int
    cond_max_stamina: int
    event_prompt: str
    preset_options: List[Dict[str, Any]]

    class Config:
        from_attributes = True

class RandomEventCreate(BaseModel):
    id: str
    title: str
    is_active: bool = True
    weight: int = 10
    cond_days: Optional[List[int]] = None
    cond_slots: Optional[List[str]] = None
    cond_location: Optional[str] = None
    cond_min_stamina: int = 0
    cond_max_stamina: int = 100
    event_prompt: str
    preset_options: List[Dict[str, Any]]

class RandomEventUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None
    weight: Optional[int] = None
    cond_days: Optional[List[int]] = None
    cond_slots: Optional[List[str]] = None
    cond_location: Optional[str] = None
    cond_min_stamina: Optional[int] = None
    cond_max_stamina: Optional[int] = None
    event_prompt: Optional[str] = None
    preset_options: Optional[List[Dict[str, Any]]] = None

class SandboxTestRequest(BaseModel):
    event_prompt: str
    preset_options: List[Dict[str, Any]]
    location_id: Optional[str] = "loc_park_creek"
    slot: Optional[str] = "morning"

class SandboxTestResponse(BaseModel):
    generated_story: TurnGenerationSchema
