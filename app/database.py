import os
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database models
class DBAgent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True)  # Vapi Assistant ID
    name = Column(String, nullable=False)
    description = Column(Text)
    phone_number_id = Column(String, nullable=False)
    status = Column(String, default="Idle")
    minutes_today = Column(Integer, default=0)
    total_minutes_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transcripts = relationship("DBTranscript", back_populates="agent", cascade="all, delete-orphan")
    csv_uploads = relationship("DBCSVUpload", back_populates="agent", cascade="all, delete-orphan")


class DBTranscript(Base):
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True)
    call_id = Column(String, nullable=False, unique=True)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime)
    total_duration = Column(Integer)  # in seconds
    segments = Column(JSON)  # Store transcript segments as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    agent = relationship("DBAgent", back_populates="transcripts")


class DBCSVUpload(Base):
    __tablename__ = "csv_uploads"

    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    row_count = Column(Integer, nullable=False)
    processed = Column(Boolean, default=False)
    file_path = Column(String)  # Path to stored CSV file
    
    # Relationships
    agent = relationship("DBAgent", back_populates="csv_uploads")


class DBCallLog(Base):
    __tablename__ = "call_logs"

    id = Column(String, primary_key=True)
    call_id = Column(String, nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    phone_number = Column(String)
    status = Column(String, nullable=False)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    duration = Column(Integer)  # in seconds
    created_at = Column(DateTime, default=datetime.utcnow)


class DBUser(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)


# Database utilities
def get_agent_by_id(db: Session, agent_id: str) -> DBAgent:
    return db.query(DBAgent).filter(DBAgent.id == agent_id).first()


def get_all_agents(db: Session) -> list[DBAgent]:
    return db.query(DBAgent).all()


def create_agent(db: Session, agent_data: dict) -> DBAgent:
    db_agent = DBAgent(**agent_data)
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def update_agent(db: Session, agent_id: str, agent_data: dict) -> DBAgent:
    db_agent = get_agent_by_id(db, agent_id)
    if db_agent:
        for key, value in agent_data.items():
            if hasattr(db_agent, key):
                setattr(db_agent, key, value)
        db_agent.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_agent)
    return db_agent


def create_transcript(db: Session, transcript_data: dict) -> DBTranscript:
    db_transcript = DBTranscript(**transcript_data)
    db.add(db_transcript)
    db.commit()
    db.refresh(db_transcript)
    return db_transcript


def create_csv_upload(db: Session, upload_data: dict) -> DBCSVUpload:
    db_upload = DBCSVUpload(**upload_data)
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    return db_upload


def create_call_log(db: Session, call_data: dict) -> DBCallLog:
    db_call = DBCallLog(**call_data)
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call


def get_user_by_username(db: Session, username: str) -> DBUser:
    return db.query(DBUser).filter(DBUser.username == username).first()


def create_user(db: Session, username: str, hashed_password: str) -> DBUser:
    db_user = DBUser(username=username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def reset_agent_minutes(db: Session, agent_ids: list[str] = None) -> list[str]:
    """Reset daily minutes for specified agents or all agents if none specified"""
    query = db.query(DBAgent)
    if agent_ids:
        query = query.filter(DBAgent.id.in_(agent_ids))
    
    agents = query.all()
    reset_agent_ids = []
    
    for agent in agents:
        agent.minutes_today = 0
        agent.updated_at = datetime.utcnow()
        reset_agent_ids.append(agent.id)
    
    db.commit()
    return reset_agent_ids