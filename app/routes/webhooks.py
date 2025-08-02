import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional

from ..database import (
    get_db, get_agent_by_id, update_agent, create_transcript, 
    create_call_log, DBTranscript
)
from ..models import VapiWebhookPayload, TranscriptSegment
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/webhook", tags=["webhooks"])

VAPI_WEBHOOK_SECRET = os.getenv("VAPI_WEBHOOK_SECRET", "your-webhook-secret")


async def verify_vapi_webhook(
    request: Request,
    x_vapi_secret: Optional[str] = Header(None)
):
    """Verify Vapi webhook secret"""
    if x_vapi_secret != VAPI_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret"
        )


@router.post("/vapi")
async def vapi_webhook(
    payload: VapiWebhookPayload,
    db: Session = Depends(get_db),
    _: None = Depends(verify_vapi_webhook)
):
    """
    Webhook to receive live updates from Vapi
    Handles: call start, end, transcript segments, status changes, minutes used
    """
    
    try:
        if payload.event_type == "call.started" and payload.call:
            # Handle call start
            call = payload.call
            agent = get_agent_by_id(db, call.assistant_id)
            
            if agent:
                # Update agent status to Calling
                update_agent(db, call.assistant_id, {
                    "status": "Calling",
                    "updated_at": datetime.utcnow()
                })
                
                # Create new transcript record
                transcript_data = {
                    "id": str(uuid.uuid4()),
                    "call_id": call.id,
                    "agent_id": call.assistant_id,
                    "started_at": call.started_at or datetime.utcnow(),
                    "segments": []
                }
                create_transcript(db, transcript_data)
                
                # Create call log entry
                call_log_data = {
                    "id": str(uuid.uuid4()),
                    "call_id": call.id,
                    "agent_id": call.assistant_id,
                    "phone_number": call.phone_number_id,
                    "status": "started",
                    "started_at": call.started_at or datetime.utcnow()
                }
                create_call_log(db, call_log_data)
        
        elif payload.event_type == "call.ended" and payload.call:
            # Handle call end
            call = payload.call
            agent = get_agent_by_id(db, call.assistant_id)
            
            if agent:
                # Update agent status back to Idle
                minutes_to_add = (call.duration or 0) // 60  # Convert seconds to minutes
                
                update_agent(db, call.assistant_id, {
                    "status": "Idle",
                    "minutes_today": agent.minutes_today + minutes_to_add,
                    "total_minutes_used": agent.total_minutes_used + minutes_to_add,
                    "updated_at": datetime.utcnow()
                })
                
                # Update transcript with end time and duration
                transcript = db.query(DBTranscript).filter(
                    DBTranscript.call_id == call.id
                ).first()
                
                if transcript:
                    transcript.ended_at = call.ended_at or datetime.utcnow()
                    transcript.total_duration = call.duration
                    db.commit()
                
                # Update call log
                from ..database import DBCallLog
                call_log = db.query(DBCallLog).filter(
                    DBCallLog.call_id == call.id
                ).first()
                
                if call_log:
                    call_log.status = "ended"
                    call_log.ended_at = call.ended_at or datetime.utcnow()
                    call_log.duration = call.duration
                    db.commit()
        
        elif payload.event_type == "transcript.update" and payload.transcript:
            # Handle transcript segment update
            transcript_data = payload.transcript
            
            # Find the transcript record
            transcript = db.query(DBTranscript).filter(
                DBTranscript.call_id == transcript_data.call_id
            ).first()
            
            if transcript:
                # Get existing segments or initialize empty list
                existing_segments = transcript.segments or []
                
                # Create new segment
                new_segment = {
                    "timestamp": transcript_data.timestamp.isoformat(),
                    "speaker": transcript_data.speaker,
                    "content": transcript_data.content
                }
                
                # Add to segments
                existing_segments.append(new_segment)
                transcript.segments = existing_segments
                
                db.commit()
        
        elif payload.event_type == "agent.status.update" and payload.call:
            # Handle agent status updates
            call = payload.call
            agent = get_agent_by_id(db, call.assistant_id)
            
            if agent:
                # Map Vapi status to our status enum
                status_mapping = {
                    "idle": "Idle",
                    "calling": "Calling",
                    "error": "Error",
                    "offline": "Offline"
                }
                
                new_status = status_mapping.get(call.status, "Idle")
                update_agent(db, call.assistant_id, {
                    "status": new_status,
                    "updated_at": datetime.utcnow()
                })
        
        return {"status": "success", "message": "Webhook processed successfully"}
    
    except Exception as e:
        print(f"Webhook processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )