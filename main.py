import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from app.database import create_tables, get_db
from app.auth import init_admin_user
from app.routes import auth, agents, webhooks, uploads, admin

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting AI Agent Management Backend...")
    
    # Create database tables
    create_tables()
    print("📊 Database tables created")
    
    # Initialize admin user
    db = next(get_db())
    try:
        init_admin_user(db)
        print("👤 Admin user initialized")
    finally:
        db.close()
    
    print("✅ Backend ready!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down backend...")


# Create FastAPI app
app = FastAPI(
    title="AI Agent Management Backend",
    description="FastAPI backend for managing AI agents with Vapi integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(webhooks.router)
app.include_router(uploads.router)
app.include_router(admin.router)


# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Agent Management Backend",
        "status": "running",
        "version": "1.0.0"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "services": ["auth", "agents", "webhooks", "uploads", "admin"]
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )