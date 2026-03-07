from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import declarative_base  # Updated import
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional
import os
from dotenv import load_dotenv
import bcrypt
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST, REGISTRY
from fastapi.responses import Response
import time
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# ============================================================================
# DATABASE SETUP
# ============================================================================

DATABASE_URL = f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', 'postgres')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'ecommerce')}"

engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================================
# DATABASE MODELS (SQLAlchemy)
# ============================================================================

class UserDB(Base):
    """SQLAlchemy model for users table"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ============================================================================
# PYDANTIC MODELS (Request/Response validation)
# ============================================================================

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserUpdate(BaseModel):
    """Schema for updating user (all fields optional)"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=8)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class UserResponse(BaseModel):
    """Schema for user response (no password)"""
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str

# ============================================================================
# PROMETHEUS METRICS (with duplicate prevention)
# ============================================================================

# Clear existing metrics if any
collectors = list(REGISTRY._collector_to_names.keys())
for collector in collectors:
    try:
        REGISTRY.unregister(collector)
    except Exception:
        pass

# Now create metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# ============================================================================
# LIFESPAN EVENTS (replaces deprecated on_event)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("=" * 60)
    print("🚀 User Service starting up")
    print(f"📊 Metrics: http://localhost:{os.getenv('PORT', 8002)}/metrics")
    print(f"❤️  Health: http://localhost:{os.getenv('PORT', 8002)}/health")
    print(f"📚 Docs: http://localhost:{os.getenv('PORT', 8002)}/docs")
    print(f"🔗 API: http://localhost:{os.getenv('PORT', 8002)}/api/users")
    print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print("=" * 60)
    
    yield
    
    # Shutdown
    print("👋 User Service shutting down")

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="User Service",
    description="User management microservice with authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# DATABASE DEPENDENCY
# ============================================================================

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# PASSWORD UTILITIES
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

# ============================================================================
# MIDDLEWARE FOR METRICS
# ============================================================================

@app.middleware("http")
async def add_metrics(request, call_next):
    """Middleware to track request metrics"""
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

# ============================================================================
# HEALTH & METRICS ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "service": "user-service",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        return Response(
            content=str({
                "status": "unhealthy",
                "service": "user-service",
                "timestamp": datetime.utcnow().isoformat(),
                "database": "disconnected",
                "error": str(e)
            }),
            status_code=503
        )

@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ============================================================================
# USER ENDPOINTS
# ============================================================================

@app.post("/api/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    try:
        existing_user = db.query(UserDB).filter(
            (UserDB.email == user.email) | (UserDB.username == user.username)
        ).first()
        
        if existing_user:
            if existing_user.email == user.email:
                raise HTTPException(status_code=409, detail="Email already registered")
            else:
                raise HTTPException(status_code=409, detail="Username already taken")
        
        hashed_pwd = hash_password(user.password)
        
        db_user = UserDB(
            email=user.email,
            username=user.username,
            hashed_password=hashed_pwd,
            full_name=user.full_name,
            phone=user.phone,
            address=user.address
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@app.get("/api/users", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all users (paginated)"""
    try:
        users = db.query(UserDB).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")

@app.get("/api/users/username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """Get user by username"""
    try:
        user = db.query(UserDB).filter(UserDB.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")

@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user"""
    try:
        db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_update.email and user_update.email != db_user.email:
            existing = db.query(UserDB).filter(UserDB.email == user_update.email).first()
            if existing:
                raise HTTPException(status_code=409, detail="Email already in use")
        
        if user_update.username and user_update.username != db_user.username:
            existing = db.query(UserDB).filter(UserDB.username == user_update.username).first()
            if existing:
                raise HTTPException(status_code=409, detail="Username already taken")
        
        update_data = user_update.dict(exclude_unset=True)
        
        if 'password' in update_data:
            update_data['hashed_password'] = hash_password(update_data.pop('password'))
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user"""
    try:
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": "User deleted successfully", "user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@app.post("/api/users/login")
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """User login (verify credentials)"""
    try:
        user = db.query(UserDB).filter(UserDB.username == user_login.username).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        if not verify_password(user_login.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        return {
            "success": True,
            "message": "Login successful",
            "user_id": user.id,
            "username": user.username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,  # Pass app object directly, not string
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8002))
    )