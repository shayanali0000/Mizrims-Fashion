from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import (
    get_db, get_agent_by_id, get_all_agents, create_agent, 
    update_agent, DBAgent
)
from ..models import (
    Agent, AgentCreate, AgentUpdate, AgentStatusResponse,
    SystemStatus, UserInDB
)
from ..auth import require_admin

router = APIRouter(prefix="/agents", tags=["agents"])


def db_agent_to_pydantic(db_agent: DBAgent) -> Agent:
    """Convert database agent to Pydantic model"""
    transcripts = []
    for db_transcript in db_agent.transcripts:
        transcript_segments = db_transcript.segments or []
        transcripts.append({
            "call_id": db_transcript.call_id,
            "started_at": db_transcript.started_at,
            "ended_at": db_transcript.ended_at,
            "segments": transcript_segments,
            "total_duration": db_transcript.total_duration
        })
    
    csv_uploads = []
    for db_upload in db_agent.csv_uploads:
        csv_uploads.append({
            "id": db_upload.id,
            "filename": db_upload.filename,
            "uploaded_at": db_upload.uploaded_at,
            "row_count": db_upload.row_count,
            "agent_id": db_upload.agent_id,
            "processed": db_upload.processed
        })
    
    return Agent(
        id=db_agent.id,
        name=db_agent.name,
        description=db_agent.description,
        phone_number_id=db_agent.phone_number_id,
        status=db_agent.status,
        minutes_today=db_agent.minutes_today,
        total_minutes_used=db_agent.total_minutes_used,
        created_at=db_agent.created_at,
        updated_at=db_agent.updated_at,
        transcripts=transcripts,
        csv_uploads=csv_uploads
    )


@router.get("/", response_model=List[Agent])
async def get_agents(
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Get list of all connected agents"""
    db_agents = get_all_agents(db)
    return [db_agent_to_pydantic(agent) for agent in db_agents]


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Get details of a specific agent"""
    db_agent = get_agent_by_id(db, agent_id)
    if not db_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    return db_agent_to_pydantic(db_agent)


@router.post("/", response_model=Agent)
async def create_new_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Create a new agent (admin only)"""
    # Check if agent already exists
    existing_agent = get_agent_by_id(db, agent_data.vapi_assistant_id)
    if existing_agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent with this Vapi Assistant ID already exists"
        )
    
    agent_dict = {
        "id": agent_data.vapi_assistant_id,
        "name": agent_data.name,
        "description": agent_data.description,
        "phone_number_id": agent_data.phone_number_id,
        "status": "Idle",
        "minutes_today": 0,
        "total_minutes_used": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    db_agent = create_agent(db, agent_dict)
    return db_agent_to_pydantic(db_agent)


@router.put("/{agent_id}", response_model=Agent)
async def update_agent_details(
    agent_id: str,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Update agent details"""
    db_agent = get_agent_by_id(db, agent_id)
    if not db_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Create update dictionary excluding None values
    update_dict = {k: v for k, v in agent_data.dict().items() if v is not None}
    
    updated_agent = update_agent(db, agent_id, update_dict)
    return db_agent_to_pydantic(updated_agent)


@router.get("/status/all", response_model=List[AgentStatusResponse])
async def get_agents_status(
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Get status of all agents for polling"""
    db_agents = get_all_agents(db)
    
    status_responses = []
    for agent in db_agents:
        # Find the most recent call/activity
        last_activity = agent.updated_at
        current_call_id = None
        
        # If agent is calling, we might have an active call
        if agent.status == "Calling" and agent.transcripts:
            # Get the most recent transcript
            recent_transcript = max(agent.transcripts, key=lambda t: t.started_at)
            if not recent_transcript.ended_at:
                current_call_id = recent_transcript.call_id
                last_activity = recent_transcript.started_at
        
        status_responses.append(AgentStatusResponse(
            agent_id=agent.id,
            name=agent.name,
            status=agent.status,
            minutes_today=agent.minutes_today,
            current_call_id=current_call_id,
            last_activity=last_activity
        ))
    
    return status_responses


@router.get("/system/status", response_model=SystemStatus)
async def get_system_status(
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Get overall system status"""
    db_agents = get_all_agents(db)
    
    total_agents = len(db_agents)
    active_calls = len([agent for agent in db_agents if agent.status == "Calling"])
    total_minutes_today = sum(agent.minutes_today for agent in db_agents)
    
    return SystemStatus(
        total_agents=total_agents,
        active_calls=active_calls,
        total_minutes_today=total_minutes_today,
        last_updated=datetime.utcnow()
    )