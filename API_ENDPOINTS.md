# AI Agent Management Backend - API Endpoints

## Base URL
```
http://localhost:8000
```

## Authentication

All endpoints except `/auth/login` require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### POST `/auth/login`
Admin login to get JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## 👥 Agent Management Endpoints

### GET `/agents/`
Get list of all connected agents.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "vapi_assistant_123",
    "name": "Sales Agent",
    "description": "Handles sales inquiries",
    "phone_number_id": "phone_456",
    "status": "Idle",
    "minutes_today": 45,
    "total_minutes_used": 1200,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T15:30:00Z",
    "transcripts": [],
    "csv_uploads": []
  }
]
```

### GET `/agents/{agent_id}`
Get details of a specific agent.

**Headers:** `Authorization: Bearer <token>`

**Response:** Same as single agent object above.

### POST `/agents/`
Create a new agent.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Customer Support Agent",
  "description": "Handles customer support calls",
  "phone_number_id": "phone_789",
  "vapi_assistant_id": "vapi_assistant_456"
}
```

**Response:** Agent object (same structure as GET)

### PUT `/agents/{agent_id}`
Update agent details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Agent Name",
  "description": "Updated description",
  "status": "Offline"
}
```

**Response:** Updated agent object

### GET `/agents/status/all`
Get status of all agents for polling.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "agent_id": "vapi_assistant_123",
    "name": "Sales Agent",
    "status": "Calling",
    "minutes_today": 45,
    "current_call_id": "call_789",
    "last_activity": "2024-01-01T15:45:00Z"
  }
]
```

### GET `/agents/system/status`
Get overall system status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_agents": 5,
  "active_calls": 2,
  "total_minutes_today": 150,
  "last_updated": "2024-01-01T15:45:00Z"
}
```

---

## 📞 Webhook Endpoints

### POST `/webhook/vapi`
Vapi webhook endpoint for call tracking and transcript updates.

**Headers:** 
- `X-Vapi-Secret: <webhook_secret>`

**Request Body (Call Started):**
```json
{
  "event_type": "call.started",
  "call": {
    "id": "call_123",
    "assistant_id": "vapi_assistant_456",
    "phone_number_id": "phone_789",
    "status": "started",
    "started_at": "2024-01-01T15:00:00Z"
  }
}
```

**Request Body (Call Ended):**
```json
{
  "event_type": "call.ended",
  "call": {
    "id": "call_123",
    "assistant_id": "vapi_assistant_456",
    "phone_number_id": "phone_789",
    "status": "ended",
    "started_at": "2024-01-01T15:00:00Z",
    "ended_at": "2024-01-01T15:05:00Z",
    "duration": 300
  }
}
```

**Request Body (Transcript Update):**
```json
{
  "event_type": "transcript.update",
  "transcript": {
    "call_id": "call_123",
    "assistant_id": "vapi_assistant_456",
    "timestamp": "2024-01-01T15:01:00Z",
    "speaker": "user",
    "content": "Hello, I'm interested in your services"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Webhook processed successfully"
}
```

---

## 📂 CSV Upload Endpoints

### POST `/agents/{agent_id}/upload_csv`
Upload contact list for an agent.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: CSV file with columns: `name`, `phone_number`, `notes` (optional)

**CSV Format:**
```csv
name,phone_number,notes
John Smith,+1234567890,VIP customer
Jane Doe,1987654321,Follow up on proposal
```

**Response:**
```json
{
  "upload_id": "upload_123",
  "filename": "contacts.csv",
  "row_count": 10,
  "valid_rows": 8,
  "invalid_rows": 2,
  "errors": [
    "Row 3: Invalid phone number format",
    "Row 7: Name is required"
  ]
}
```

### GET `/agents/{agent_id}/uploads`
Get CSV upload history for an agent.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "upload_123",
    "filename": "contacts.csv",
    "uploaded_at": "2024-01-01T10:00:00Z",
    "row_count": 10,
    "processed": true
  }
]
```

---

## 🛠️ Admin Tool Endpoints

### POST `/admin/reset_minutes`
Reset daily minutes for specified agents or all agents.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "agent_ids": ["vapi_assistant_123", "vapi_assistant_456"]
}
```

**Request Body (Reset All):**
```json
{
  "agent_ids": null
}
```

**Response:**
```json
{
  "reset_agents": ["vapi_assistant_123", "vapi_assistant_456"],
  "reset_count": 2,
  "timestamp": "2024-01-01T16:00:00Z"
}
```

### POST `/admin/register_agent`
Register a new agent manually.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as `POST /agents/`

**Response:** Agent object

### GET `/admin/system_info`
Get detailed system information and statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "system_stats": {
    "total_agents": 5,
    "active_agents": 2,
    "idle_agents": 2,
    "offline_agents": 1,
    "error_agents": 0
  },
  "usage_stats": {
    "total_minutes_today": 150,
    "total_minutes_all_time": 5000,
    "total_transcripts": 200,
    "total_csv_uploads": 25
  },
  "most_active_agent": {
    "id": "vapi_assistant_123",
    "name": "Sales Agent",
    "total_minutes": 2000
  },
  "last_updated": "2024-01-01T16:00:00Z"
}
```

### POST `/admin/bulk_status_update`
Bulk update status for multiple agents.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "agent_ids": ["vapi_assistant_123", "vapi_assistant_456"],
  "new_status": "Offline"
}
```

**Valid Statuses:** `Idle`, `Calling`, `Offline`, `Error`

**Response:**
```json
{
  "updated_agents": ["vapi_assistant_123", "vapi_assistant_456"],
  "updated_count": 2,
  "errors": [],
  "new_status": "Offline",
  "timestamp": "2024-01-01T16:00:00Z"
}
```

---

## 🏥 Health Check Endpoints

### GET `/`
Basic health check.

**Response:**
```json
{
  "message": "AI Agent Management Backend",
  "status": "running",
  "version": "1.0.0"
}
```

### GET `/health`
Detailed health check.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "services": ["auth", "agents", "webhooks", "uploads", "admin"]
}
```

---

## Status Codes

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors, missing data)
- `401` - Unauthorized (missing or invalid JWT token)
- `403` - Forbidden (admin access required)
- `404` - Not Found (agent not found)
- `500` - Internal Server Error

---

## Error Response Format

```json
{
  "detail": "Error message description"
}
```

---

## Interactive Documentation

When running the server, visit these URLs for interactive API documentation:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`