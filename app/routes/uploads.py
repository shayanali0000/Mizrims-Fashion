import os
import uuid
import csv
import aiofiles
import httpx
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db, get_agent_by_id, create_csv_upload
from ..models import CSVUploadResponse, ContactRow, UserInDB
from ..auth import require_admin
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/agents", tags=["uploads"])

UPLOAD_DIR = "uploads"
VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_BASE_URL = "https://api.vapi.ai/v1"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_csv_data(file_path: str) -> tuple[List[ContactRow], List[str], int]:
    """Validate CSV data and return valid contacts, errors, and total row count"""
    valid_contacts = []
    errors = []
    total_rows = 0
    
    try:
        with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
            # Try to detect CSV format
            sniffer = csv.Sniffer()
            sample = csvfile.read(1024)
            csvfile.seek(0)
            
            try:
                dialect = sniffer.sniff(sample)
                reader = csv.DictReader(csvfile, dialect=dialect)
            except:
                # Fall back to default
                reader = csv.DictReader(csvfile)
            
            # Check for required columns
            fieldnames = reader.fieldnames or []
            required_columns = ["name", "phone_number"]
            missing_columns = [col for col in required_columns if col not in fieldnames]
            
            if missing_columns:
                errors.append(f"Missing required columns: {', '.join(missing_columns)}")
                return valid_contacts, errors, 0
            
            # Process each row
            for index, row in enumerate(reader):
                total_rows += 1
                try:
                    # Validate name (not empty)
                    name = str(row.get("name", "")).strip()
                    if not name:
                        errors.append(f"Row {index + 2}: Name is required")  # +2 because of header row
                        continue
                    
                    # Validate phone number (basic validation)
                    phone = str(row.get("phone_number", "")).strip()
                    if not phone:
                        errors.append(f"Row {index + 2}: Phone number is required")
                        continue
                    
                    # Remove common phone number formatting
                    phone = phone.replace("(", "").replace(")", "").replace("-", "").replace(" ", "").replace("+", "")
                    
                    # Basic phone number validation (should be numeric and reasonable length)
                    if not phone.isdigit() or len(phone) < 10 or len(phone) > 15:
                        errors.append(f"Row {index + 2}: Invalid phone number format")
                        continue
                    
                    # Get notes (optional)
                    notes = str(row.get("notes", "")).strip() if row.get("notes") else None
                    if notes == "":
                        notes = None
                    
                    valid_contacts.append(ContactRow(
                        name=name,
                        phone_number=phone,
                        notes=notes
                    ))
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: Error processing row - {str(e)}")
            
    except Exception as e:
        errors.append(f"Error reading CSV file: {str(e)}")
    
    return valid_contacts, errors, total_rows


async def send_contacts_to_vapi(agent_id: str, contacts: List[ContactRow]) -> bool:
    """Send contacts to Vapi for outbound calls"""
    if not VAPI_API_KEY:
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {VAPI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            # Convert contacts to Vapi format
            vapi_contacts = []
            for contact in contacts:
                vapi_contact = {
                    "name": contact.name,
                    "phoneNumber": contact.phone_number
                }
                if contact.notes:
                    vapi_contact["notes"] = contact.notes
                
                vapi_contacts.append(vapi_contact)
            
            # Send to Vapi API (this endpoint might vary based on Vapi's actual API)
            response = await client.post(
                f"{VAPI_BASE_URL}/assistants/{agent_id}/contacts",
                headers=headers,
                json={"contacts": vapi_contacts}
            )
            
            return response.status_code == 200
    
    except Exception as e:
        print(f"Error sending contacts to Vapi: {str(e)}")
        return False


@router.post("/{agent_id}/upload_csv", response_model=CSVUploadResponse)
async def upload_csv_contacts(
    agent_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Admin uploads contact list for an agent"""
    
    # Verify agent exists
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    # Generate unique upload ID and file path
    upload_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}_{file.filename}")
    
    try:
        # Save uploaded file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Validate CSV data
        valid_contacts, errors, total_rows = validate_csv_data(file_path)
        
        # Save upload record to database
        upload_data = {
            "id": upload_id,
            "filename": file.filename,
            "agent_id": agent_id,
            "uploaded_at": datetime.utcnow(),
            "row_count": total_rows,
            "processed": False,
            "file_path": file_path
        }
        
        db_upload = create_csv_upload(db, upload_data)
        
        # If we have valid contacts and Vapi integration is available, send them
        vapi_success = False
        if valid_contacts and VAPI_API_KEY:
            vapi_success = await send_contacts_to_vapi(agent_id, valid_contacts)
            
            if vapi_success:
                # Mark as processed
                db_upload.processed = True
                db.commit()
        
        return CSVUploadResponse(
            upload_id=upload_id,
            filename=file.filename,
            row_count=total_rows,
            valid_rows=len(valid_contacts),
            invalid_rows=total_rows - len(valid_contacts),
            errors=errors
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up file if something went wrong
        if os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV upload: {str(e)}"
        )


@router.get("/{agent_id}/uploads")
async def get_agent_uploads(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(require_admin)
):
    """Get CSV upload history for an agent"""
    
    # Verify agent exists
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    uploads = []
    for upload in agent.csv_uploads:
        uploads.append({
            "id": upload.id,
            "filename": upload.filename,
            "uploaded_at": upload.uploaded_at,
            "row_count": upload.row_count,
            "processed": upload.processed
        })
    
    return uploads