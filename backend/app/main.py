import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure root and backend directory are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Load environment variables
load_dotenv(dotenv_path=backend_dir / ".env")
load_dotenv(dotenv_path=root_dir / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.appointments import router as appointment_router
from app.routes.queue import router as queue_router
from app.routes.smart_queue import router as smart_queue_router
from app.routes.patient_orchestrator import router as patient_orchestrator_router

from maps_traffic.router import router as maps_traffic_router, maps_router
from app.supabase_client import supabase


app = FastAPI(
    title="Smriti Smart Queue API",
    version="1.0.0",
    description="Unified backend API combining Appointment Booking, Smart Queue Prediction, and Maps & Traffic services."
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Feature Routers
app.include_router(appointment_router)
app.include_router(queue_router)
app.include_router(smart_queue_router)
app.include_router(maps_traffic_router)
app.include_router(maps_router)
app.include_router(patient_orchestrator_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Smriti API",
        "version": "1.0.0"
    }


@app.get("/db-test")
def database_test():
    if not supabase:
        return {
            "database": "unconfigured",
            "status": "mock_mode",
            "message": "Supabase credentials not configured in .env"
        }

    try:
        supabase.table("hospitals").select("id").limit(1).execute()
        return {
            "database": "connected",
            "status": "success"
        }
    except Exception as e:
        return {
            "database": "connection_failed",
            "status": "error",
            "detail": str(e)
        }