from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

from app.supabase_client import supabase
from app.schemas.appointment import CreateAppointmentRequest
from app.routes.appointments import create_appointment

try:
    from prediction.estimator import predict_queue
except ImportError:
    import sys
    from pathlib import Path
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    if str(root_dir) not in sys.path:
        sys.path.insert(0, str(root_dir))
    from prediction.estimator import predict_queue

from maps_traffic.service import MapsTrafficService
maps_service = MapsTrafficService()

router = APIRouter(tags=["Patient Orchestrator & Standard Aliases"])


# Aliased endpoint for POST /appointments/book
@router.post(
    "/appointments/book",
    summary="Book Appointment (Standard Alias)",
    description="Creates an appointment and generates queue token."
)
def book_appointment_alias(data: CreateAppointmentRequest):
    return create_appointment(data)


# Aliased endpoint for GET /queue/{token}
@router.get(
    "/queue/{token}",
    summary="Get Queue Status by Token (Standard Alias)",
    description="Retrieves patient queue status and people ahead using token or appointment ID."
)
def get_queue_by_token(token: str):
    numeric_val = None
    if token.startswith("TKN-"):
        try:
            numeric_val = int(token.replace("TKN-", ""))
        except ValueError:
            pass
    elif token.isdigit():
        numeric_val = int(token)
        token = f"TKN-{numeric_val}"

    if supabase:
        try:
            # Query queue_entries by appointment_id or token_number
            query = supabase.table("queue_entries").select("*")
            if numeric_val is not None:
                query = query.eq("token_number", numeric_val)
            else:
                query = query.eq("appointment_id", token)

            res = query.execute()
            if res.data and len(res.data) > 0:
                entry = res.data[0]
                appointment_id = entry["appointment_id"]
                doctor_id = entry["doctor_id"]
                queue_date = entry["queue_date"]
                patient_token = entry["token_number"]

                ahead_res = (
                    supabase.table("queue_entries")
                    .select("id")
                    .eq("doctor_id", doctor_id)
                    .eq("queue_date", queue_date)
                    .in_("status", ["waiting", "called", "in_consultation"])
                    .lt("token_number", patient_token)
                    .execute()
                )
                people_ahead = len(ahead_res.data or [])

                return {
                    "success": True,
                    "appointment_id": appointment_id,
                    "your_token": f"TKN-{patient_token}",
                    "numeric_token": patient_token,
                    "people_ahead": people_ahead,
                    "status": entry.get("status", "waiting")
                }
        except Exception:
            pass

    # Fallback response
    num_token = numeric_val if numeric_val is not None else 103
    return {
        "success": True,
        "appointment_id": token,
        "your_token": f"TKN-{num_token}",
        "numeric_token": num_token,
        "people_ahead": max(0, num_token - 102 - 1),
        "status": "waiting"
    }


# Orchestrator endpoint: GET /patient/dashboard/{token}
@router.get(
    "/patient/dashboard/{token}",
    summary="Get Patient Dashboard Orchestration",
    description="Combines Queue status + Smart Queue Prediction + Maps Travel Summary into a single response."
)
def get_patient_dashboard(
    token: str,
    patient_lat: float = Query(28.6139, description="Patient Latitude"),
    patient_lng: float = Query(77.2090, description="Patient Longitude"),
    clinic_lat: float = Query(28.5355, description="Clinic Latitude"),
    clinic_lng: float = Query(77.3910, description="Clinic Longitude"),
    safety_buffer: int = Query(10, description="Safety buffer minutes")
):
    # Parse numeric token
    numeric_token = 103
    if token.startswith("TKN-"):
        try:
            numeric_token = int(token.replace("TKN-", ""))
        except ValueError:
            pass
    elif token.isdigit():
        numeric_token = int(token)
        token = f"TKN-{numeric_token}"

    current_serving_token = 102
    avg_consultation_time = 8.0
    doctor_delay = 2.0
    consultation_count = 22
    people_ahead = max(0, numeric_token - current_serving_token - 1)
    status_str = "waiting"
    doctor_info = {
        "name": "Dr. Divyansh Pandey",
        "specialization": "Cardiologist",
        "hospital_name": "City Care Hospital, Delhi"
    }

    # Attempt Supabase database retrieval if available
    if supabase:
        try:
            q_res = (
                supabase.table("queue_entries")
                .select("*")
                .or_(f"appointment_id.eq.{token},token_number.eq.{numeric_token}")
                .execute()
            )
            if q_res.data and len(q_res.data) > 0:
                e = q_res.data[0]
                numeric_token = e.get("token_number", numeric_token)
                status_str = e.get("status", status_str)
                doctor_id = e.get("doctor_id")
                queue_date = e.get("queue_date")

                if doctor_id:
                    doc_res = supabase.table("doctors").select("*").eq("id", doctor_id).execute()
                    if doc_res.data and len(doc_res.data) > 0:
                        doc = doc_res.data[0]
                        doctor_info = {
                            "name": doc.get("name", doctor_info["name"]),
                            "specialization": doc.get("specialization", doctor_info["specialization"]),
                            "hospital_name": doc.get("hospital_name", doctor_info["hospital_name"])
                        }
                        if doc.get("average_consultation_minutes"):
                            avg_consultation_time = float(doc["average_consultation_minutes"])

                if doctor_id and queue_date:
                    ahead_res = (
                        supabase.table("queue_entries")
                        .select("id")
                        .eq("doctor_id", doctor_id)
                        .eq("queue_date", queue_date)
                        .in_("status", ["waiting", "called", "in_consultation"])
                        .lt("token_number", numeric_token)
                        .execute()
                    )
                    people_ahead = len(ahead_res.data or [])
        except Exception:
            pass

    # 1. Run Prediction Engine
    prediction_result = predict_queue(
        current_token=current_serving_token,
        patient_token=numeric_token,
        average_consultation_time=avg_consultation_time,
        doctor_delay=doctor_delay,
        consultation_count=consultation_count,
    )
    pred_dict = prediction_result.to_dict()

    # 2. Run Maps & Traffic Service
    travel_summary = maps_service.generate_travel_summary(
        token_number=f"TKN-{numeric_token}",
        appointment_time=pred_dict["estimated_appointment_time"],
        patient_lat=patient_lat,
        patient_lng=patient_lng,
        clinic_lat=clinic_lat,
        clinic_lng=clinic_lng,
        safety_buffer=safety_buffer
    )

    # 3. Calculate Leave Alert
    total_required_time = travel_summary.travel_minutes + safety_buffer
    should_leave_now = total_required_time >= pred_dict["estimated_wait_minutes"]

    return {
        "success": True,
        "token_number": f"TKN-{numeric_token}",
        "numeric_token": numeric_token,
        "doctor": doctor_info,
        "queue": {
            "current_token": current_serving_token,
            "people_ahead": people_ahead,
            "status": status_str
        },
        "prediction": pred_dict,
        "maps": {
            "distance_km": travel_summary.distance_km,
            "travel_minutes": travel_summary.travel_minutes,
            "traffic_level": travel_summary.traffic_level,
            "leave_home_at": travel_summary.leave_home_at,
            "safety_buffer": safety_buffer,
            "should_leave_now": should_leave_now
        }
    }
