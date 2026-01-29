from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
import os
from dotenv import load_dotenv
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
# DATABASE MODELS
# ============================================================================

class PaymentDB(Base):
    """SQLAlchemy model for payments table"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)  # credit_card, paypal, stripe, etc.
    status = Column(String, nullable=False, default='pending')  # pending, completed, failed, refunded
    transaction_id = Column(String, unique=True, index=True)
    payment_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class PaymentCreate(BaseModel):
    """Schema for creating a new payment"""
    order_id: int = Field(..., gt=0)
    amount: float = Field(..., gt=0)
    payment_method: str = Field(..., min_length=2, max_length=50)

class PaymentUpdate(BaseModel):
    """Schema for updating payment"""
    status: Optional[str] = Field(None, min_length=2, max_length=50)
    transaction_id: Optional[str] = Field(None, min_length=5, max_length=100)

class PaymentResponse(BaseModel):
    """Schema for payment response"""
    id: int
    order_id: int
    amount: float
    payment_method: str
    status: str
    transaction_id: Optional[str]
    payment_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RefundRequest(BaseModel):
    """Schema for refund request"""
    reason: Optional[str] = None

# ============================================================================
# PROMETHEUS METRICS
# ============================================================================

# Clear existing metrics
collectors = list(REGISTRY._collector_to_names.keys())
for collector in collectors:
    try:
        REGISTRY.unregister(collector)
    except Exception:
        pass

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

PAYMENT_COUNT = Counter(
    'payments_total',
    'Total payments processed',
    ['payment_method', 'status']
)

# ============================================================================
# LIFESPAN EVENTS
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("=" * 60)
    print("🚀 Payment Service starting up")
    print(f"📊 Metrics: http://localhost:{os.getenv('PORT', 8004)}/metrics")
    print(f"❤️  Health: http://localhost:{os.getenv('PORT', 8004)}/health")
    print(f"📚 Docs: http://localhost:{os.getenv('PORT', 8004)}/docs")
    print(f"🔗 API: http://localhost:{os.getenv('PORT', 8004)}/api/payments")
    print(f"🌍 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print("=" * 60)
    
    yield
    
    # Shutdown
    print("👋 Payment Service shutting down")

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Payment Service",
    description="Payment processing microservice",
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
# METRICS MIDDLEWARE
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
# ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "service": "payment-service",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        return Response(
            content=str({
                "status": "unhealthy",
                "service": "payment-service",
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

@app.post("/api/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    """Process a new payment"""
    try:
        # Create payment record
        db_payment = PaymentDB(
            order_id=payment.order_id,
            amount=payment.amount,
            payment_method=payment.payment_method,
            status='pending'
        )
        
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        
        # Track payment metric
        PAYMENT_COUNT.labels(
            payment_method=payment.payment_method,
            status='pending'
        ).inc()
        
        return db_payment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")

@app.get("/api/payments", response_model=List[PaymentResponse])
async def get_payments(
    order_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all payments with optional filters"""
    try:
        query = db.query(PaymentDB)
        
        if order_id:
            query = query.filter(PaymentDB.order_id == order_id)
        
        if status:
            query = query.filter(PaymentDB.status == status)
        
        payments = query.offset(skip).limit(limit).all()
        return payments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@app.get("/api/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Get payment by ID"""
    try:
        payment = db.query(PaymentDB).filter(PaymentDB.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment: {str(e)}")

@app.get("/api/payments/order/{order_id}", response_model=List[PaymentResponse])
async def get_payments_by_order(order_id: int, db: Session = Depends(get_db)):
    """Get all payments for a specific order"""
    try:
        payments = db.query(PaymentDB).filter(PaymentDB.order_id == order_id).all()
        return payments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")

@app.put("/api/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    payment_update: PaymentUpdate,
    db: Session = Depends(get_db)
):
    """Update payment status or transaction ID"""
    try:
        payment = db.query(PaymentDB).filter(PaymentDB.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Track old status for metrics
        old_status = payment.status
        
        # Update fields
        if payment_update.status:
            payment.status = payment_update.status
            if payment_update.status == 'completed':
                payment.payment_date = datetime.utcnow()
        
        if payment_update.transaction_id:
            payment.transaction_id = payment_update.transaction_id
        
        payment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(payment)
        
        # Track payment status change
        if payment_update.status and payment_update.status != old_status:
            PAYMENT_COUNT.labels(
                payment_method=payment.payment_method,
                status=payment_update.status
            ).inc()
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update payment: {str(e)}")

@app.post("/api/payments/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    payment_id: int,
    refund: RefundRequest,
    db: Session = Depends(get_db)
):
    """Refund a payment"""
    try:
        payment = db.query(PaymentDB).filter(PaymentDB.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.status != 'completed':
            raise HTTPException(status_code=400, detail="Only completed payments can be refunded")
        
        # Update to refunded status
        payment.status = 'refunded'
        payment.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(payment)
        
        # Track refund metric
        PAYMENT_COUNT.labels(
            payment_method=payment.payment_method,
            status='refunded'
        ).inc()
        
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to refund payment: {str(e)}")

@app.delete("/api/payments/{payment_id}")
async def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    """Delete payment (admin only)"""
    try:
        payment = db.query(PaymentDB).filter(PaymentDB.id == payment_id).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        db.delete(payment)
        db.commit()
        
        return {
            "success": True,
            "message": "Payment deleted successfully",
            "payment_id": payment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete payment: {str(e)}")

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8004))
    )