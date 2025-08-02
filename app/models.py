from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class AgentStatus(str, Enum):
    IDLE = "Idle"
    CALLING = "Calling"
    OFFLINE = "Offline"
    ERROR = "Error"


class CallStatus(str, Enum):
    STARTED = "started"
    ENDED = "ended"
    IN_PROGRESS = "in_progress"


# Pydantic models for API
class TranscriptSegment(BaseModel):
    timestamp: datetime
    speaker: str  # "user" or "assistant"
    content: str


class Transcript(BaseModel):
    call_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    segments: List[TranscriptSegment] = []
    total_duration: Optional[int] = None  # in seconds


class CSVUpload(BaseModel):
    id: Optional[str] = None
    filename: str
    uploaded_at: datetime
    row_count: int
    agent_id: str
    processed: bool = False


class Agent(BaseModel):
    id: str  # Vapi Assistant ID
    name: str
    description: Optional[str] = None
    phone_number_id: str
    status: AgentStatus = AgentStatus.IDLE
    minutes_today: int = 0
    total_minutes_used: int = 0
    created_at: datetime
    updated_at: datetime
    transcripts: List[Transcript] = []
    csv_uploads: List[CSVUpload] = []


class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    phone_number_id: str
    vapi_assistant_id: str


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    phone_number_id: Optional[str] = None
    status: Optional[AgentStatus] = None


# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    username: str


class UserInDB(User):
    hashed_password: str


class LoginRequest(BaseModel):
    username: str
    password: str


# Vapi webhook models
class VapiWebhookCall(BaseModel):
    id: str
    assistant_id: str
    phone_number_id: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None


class VapiWebhookTranscript(BaseModel):
    call_id: str
    assistant_id: str
    timestamp: datetime
    speaker: str
    content: str


class VapiWebhookPayload(BaseModel):
    event_type: str  # "call.started", "call.ended", "transcript.update", etc.
    call: Optional[VapiWebhookCall] = None
    transcript: Optional[VapiWebhookTranscript] = None


# CSV upload models
class ContactRow(BaseModel):
    name: str
    phone_number: str
    notes: Optional[str] = None


class CSVUploadResponse(BaseModel):
    upload_id: str
    filename: str
    row_count: int
    valid_rows: int
    invalid_rows: int
    errors: List[str] = []


# Status and monitoring models
class AgentStatusResponse(BaseModel):
    agent_id: str
    name: str
    status: AgentStatus
    minutes_today: int
    current_call_id: Optional[str] = None
    last_activity: Optional[datetime] = None


class SystemStatus(BaseModel):
    total_agents: int
    active_calls: int
    total_minutes_today: int
    last_updated: datetime


# Admin tools models
class MinuteResetRequest(BaseModel):
    agent_ids: Optional[List[str]] = None  # If None, reset all agents


class MinuteResetResponse(BaseModel):
    reset_agents: List[str]
    reset_count: int
    timestamp: datetime