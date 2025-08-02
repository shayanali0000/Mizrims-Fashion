# AI Agent Management Backend

A FastAPI backend for managing AI agents with Vapi integration. This system provides admin-only access to manage AI calling agents, track transcripts, handle CSV uploads for contacts, and monitor usage statistics.

## 🚀 Features

### 🔐 Authentication
- Admin-only login with JWT tokens
- Secure middleware protecting all routes except login
- Password-based authentication with bcrypt hashing

### 👥 Agent Management
- View all connected agents
- Get detailed agent information (status, transcripts, minutes, etc.)
- Create and update agent configurations
- Real-time status monitoring

### 📞 Call Tracking & Transcripts
- Webhook integration with Vapi for live updates
- Real-time call status tracking (start, end, in-progress)
- Complete transcript storage with segments
- Daily and total minute tracking per agent

### 📂 CSV Contact Management
- Upload contact lists for agents
- CSV validation (name, phone_number, notes)
- Integration with Vapi API for outbound calls
- Upload history tracking

### 🔄 Real-Time Status
- Polling endpoint for agent status updates
- System-wide statistics
- WebSocket support (ready for future implementation)

### 🛠️ Admin Tools
- Monthly/manual minute reset functionality
- Bulk agent status updates
- System information dashboard
- Agent registration tools

## 📋 Requirements

- Python 3.8+
- SQLite (or PostgreSQL for production)
- Vapi API access

## 🏗️ Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ai-agent-backend
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# JWT settings
SECRET_KEY=your_jwt_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Vapi settings
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret

# Database
DATABASE_URL=sqlite:///./app.db

# Server settings
HOST=0.0.0.0
PORT=8000
```

4. **Run the application:**
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔗 API Endpoints

### Authentication
- `POST /auth/login` - Admin login (returns JWT token)

### Agent Management
- `GET /agents/` - Get all agents
- `GET /agents/{agent_id}` - Get specific agent details
- `POST /agents/` - Create new agent
- `PUT /agents/{agent_id}` - Update agent details
- `GET /agents/status/all` - Get all agents status (for polling)
- `GET /agents/system/status` - Get system statistics

### Webhooks
- `POST /webhook/vapi` - Vapi webhook endpoint (secured with secret)

### CSV Uploads
- `POST /agents/{agent_id}/upload_csv` - Upload contact CSV for agent
- `GET /agents/{agent_id}/uploads` - Get upload history for agent

### Admin Tools
- `POST /admin/reset_minutes` - Reset daily minutes for agents
- `POST /admin/register_agent` - Register new agent manually
- `GET /admin/system_info` - Get detailed system information
- `POST /admin/bulk_status_update` - Bulk update agent statuses

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check

## 🔒 Security Features

- JWT token authentication
- Admin-only access control
- Webhook secret verification
- Input validation and sanitization
- CORS middleware configuration
- File upload validation

## 📊 Database Schema

### Agents
- `id` (Primary Key - Vapi Assistant ID)
- `name`, `description`
- `phone_number_id`
- `status` (Idle, Calling, Offline, Error)
- `minutes_today`, `total_minutes_used`
- `created_at`, `updated_at`

### Transcripts
- `id` (Primary Key)
- `call_id` (Unique)
- `agent_id` (Foreign Key)
- `started_at`, `ended_at`
- `total_duration`
- `segments` (JSON array)

### CSV Uploads
- `id` (Primary Key)
- `filename`, `agent_id`
- `uploaded_at`, `row_count`
- `processed`, `file_path`

### Call Logs
- `id` (Primary Key)
- `call_id`, `agent_id`
- `phone_number`, `status`
- `started_at`, `ended_at`, `duration`

## 🔄 Vapi Integration

The system integrates with Vapi through:

1. **Webhooks**: Receives real-time updates for:
   - Call started/ended events
   - Transcript segments
   - Agent status changes
   - Usage statistics

2. **API Calls**: Sends contact lists to Vapi for outbound calling

3. **Authentication**: Uses API keys for secure communication

## 📱 Frontend Integration

The backend is designed to work with a frontend dashboard that can:

- Poll `/agents/status/all` for real-time updates
- Display agent statistics and call logs
- Handle CSV uploads through form submissions
- Provide admin controls for agent management

## 🔧 Configuration

### Environment Variables
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password
- `SECRET_KEY` - JWT signing secret
- `VAPI_API_KEY` - Vapi API authentication
- `VAPI_WEBHOOK_SECRET` - Webhook verification secret
- `DATABASE_URL` - Database connection string

### Production Deployment
For production:
1. Use PostgreSQL instead of SQLite
2. Set strong passwords and secrets
3. Configure CORS origins properly
4. Use HTTPS with SSL certificates
5. Set up proper logging and monitoring

## 📝 Usage Examples

### Login and Get Token
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

### Get All Agents
```bash
curl -X GET "http://localhost:8000/agents/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Upload CSV Contacts
```bash
curl -X POST "http://localhost:8000/agents/AGENT_ID/upload_csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@contacts.csv"
```

### Reset Agent Minutes
```bash
curl -X POST "http://localhost:8000/admin/reset_minutes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_ids": ["agent1", "agent2"]}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the API documentation at `/docs` when running
2. Review the logs for error details
3. Ensure all environment variables are properly set
4. Verify Vapi API connectivity and credentials
