from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
import os
import socket

app = FastAPI(title="FastAPI Metrics Service")

# Auto-instrument the app — exposes /metrics automatically
Instrumentator().instrument(app).expose(app)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "fastapi-metrics",
        "version": os.environ.get("APP_VERSION", "1.0.0"),
        "hostname": socket.gethostname(),
    }


@app.get("/")
def root():
    return {
        "message": "FastAPI metrics service running",
        "endpoints": ["/health", "/metrics", "/docs"],
    }