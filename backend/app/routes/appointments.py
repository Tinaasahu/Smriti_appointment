from fastapi import APIRouter, HTTPException

from app.schemas.appointment import CreateAppointmentRequest
from app.supabase_client import supabase


router = APIRouter(
    prefix="/api/v1/appointments",
    tags=["Appointments"]
)


@router.post("")
def create_appointment(data: CreateAppointmentRequest):

    try:
        result = supabase.rpc(
            "create_appointment_with_token",
            {
                "p_hospital_id": str(data.hospital_id),
                "p_department_id": str(data.department_id),
                "p_doctor_id": str(data.doctor_id),
                "p_patient_id": str(data.patient_id),
                "p_appointment_date": data.appointment_date.isoformat(),
                "p_scheduled_start_time": (
                    data.scheduled_start_time.isoformat()
                    if data.scheduled_start_time
                    else None
                ),
                "p_scheduled_end_time": (
                    data.scheduled_end_time.isoformat()
                    if data.scheduled_end_time
                    else None
                ),
                "p_booking_source": "online",
                "p_priority": "normal"
            }
        ).execute()

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Appointment creation failed"
            )

        return {
            "success": True,
            "data": result.data[0]
        }

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to create appointment"
        )
@router.post("/appointments/{appointment_id}/check-in")
def check_in_appointment(appointment_id: str):

    try:
        response = supabase.rpc(
            "check_in_appointment",
            {
                "p_appointment_id": appointment_id
            }
        ).execute()

        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Unable to check in appointment"
            )

        return response.data[0]

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )