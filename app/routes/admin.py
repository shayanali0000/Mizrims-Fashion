from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db, reset_agent_minutes, get_all_agents
from ..models import (
    MinuteResetRequest, MinuteResetResponse, AgentCreate, 
    Agent, UserInDB
)
from ..auth import require_admin
from ..routes.agents import db_agent_to_pydantic

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reset_minutes", response_model=MinuteResetResponse)
async def reset_agent_daily_minutes(
    reset_request: MinuteResetRequest,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Reset daily minutes for specified agents or all agents"""
    
    try:
        # Reset minutes for specified agents or all agents
        reset_agent_ids = reset_agent_minutes(db, reset_request.agent_ids)
        
        return MinuteResetResponse(
            reset_agents=reset_agent_ids,
            reset_count=len(reset_agent_ids),
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting minutes: {str(e)}"
        )


@router.post("/register_agent", response_model=Agent)
async def register_new_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """
    Manual agent registration tool for owner
    Links new Vapi Assistant ID with phone number and metadata
    """
    
    # This is the same as the agents POST route, but under admin namespace
    # for clear separation of admin functions
    from ..routes.agents import create_new_agent
    
    return await create_new_agent(agent_data, db, current_user)


@router.get("/system_info")
async def get_system_info(
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Get system information and statistics"""
    
    agents = get_all_agents(db)
    
    # Calculate various stats
    total_agents = len(agents)
    active_agents = len([a for a in agents if a.status == "Calling"])
    idle_agents = len([a for a in agents if a.status == "Idle"])
    offline_agents = len([a for a in agents if a.status == "Offline"])
    error_agents = len([a for a in agents if a.status == "Error"])
    
    total_minutes_today = sum(a.minutes_today for a in agents)
    total_minutes_all_time = sum(a.total_minutes_used for a in agents)
    
    # Calculate total transcripts and calls
    total_transcripts = sum(len(a.transcripts) for a in agents)
    total_uploads = sum(len(a.csv_uploads) for a in agents)
    
    # Find most active agent
    most_active_agent = None
    if agents:
        most_active = max(agents, key=lambda a: a.total_minutes_used)
        most_active_agent = {
            "id": most_active.id,
            "name": most_active.name,
            "total_minutes": most_active.total_minutes_used
        }
    
    return {
        "system_stats": {
            "total_agents": total_agents,
            "active_agents": active_agents,
            "idle_agents": idle_agents,
            "offline_agents": offline_agents,
            "error_agents": error_agents
        },
        "usage_stats": {
            "total_minutes_today": total_minutes_today,
            "total_minutes_all_time": total_minutes_all_time,
            "total_transcripts": total_transcripts,
            "total_csv_uploads": total_uploads
        },
        "most_active_agent": most_active_agent,
        "last_updated": datetime.utcnow()
    }


@router.post("/bulk_status_update")
async def bulk_update_agent_status(
    agent_ids: list[str],
    new_status: str,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Bulk update status for multiple agents"""
    
    from ..database import update_agent
    
    valid_statuses = ["Idle", "Calling", "Offline", "Error"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    updated_agents = []
    errors = []
    
    for agent_id in agent_ids:
        try:
            updated_agent = update_agent(db, agent_id, {
                "status": new_status,
                "updated_at": datetime.utcnow()
            })
            if updated_agent:
                updated_agents.append(agent_id)
            else:
                errors.append(f"Agent {agent_id} not found")
        except Exception as e:
            errors.append(f"Error updating agent {agent_id}: {str(e)}")
    
    return {
        "updated_agents": updated_agents,
        "updated_count": len(updated_agents),
        "errors": errors,
        "new_status": new_status,
        "timestamp": datetime.utcnow()
    }