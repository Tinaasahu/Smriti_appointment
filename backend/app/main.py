from fastapi import FastAPI

from app.routes.appointments import router as appointment_router
from app.routes.queue import router as queue_router
from app.supabase_client import supabase


app = FastAPI(
    title="Smart Queue API",
    version="1.0.0"
)


app.include_router(appointment_router)
app.include_router(queue_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/db-test")
def database_test():

    try:
        (
            supabase
            .table("hospitals")
            .select("id")
            .limit(1)
            .execute()
        )

        return {
            "database": "connected",
            "status": "success"
        }

    except Exception:
        return {
            "database": "connection_failed",
            "status": "error"
        }