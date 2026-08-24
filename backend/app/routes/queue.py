from fastapi import APIRouter, HTTPException, Query

from app.supabase_client import supabase


router = APIRouter(
    prefix="/api/v1/queue",
    tags=["Queue"]
)


ACTIVE_APPOINTMENT_STATUSES = [
    "checked_in",
    "waiting",
    "called",
    "in_consultation"
]


@router.get("/doctor/{doctor_id}")
def get_doctor_queue(
    doctor_id: str,
    queue_date: str = Query(...)
):
    try:
        result = (
            supabase
            .table("queue_entries")
            .select(
                "id, appointment_id, doctor_id, queue_date, "
                "token_number, status, joined_at, called_at, "
                "consultation_started_at, consultation_completed_at, "
                "created_at"
            )
            .eq("doctor_id", doctor_id)
            .eq("queue_date", queue_date)
            .order("token_number", desc=False)
            .execute()
        )

        entries = result.data or []

        if not entries:
            return {
                "success": True,
                "doctor_id": doctor_id,
                "queue_date": queue_date,
                "total_entries": 0,
                "queue": []
            }

        appointment_ids = [
            entry["appointment_id"]
            for entry in entries
        ]

        appointment_result = (
            supabase
            .table("appointments")
            .select("id, status, priority")
            .in_("id", appointment_ids)
            .execute()
        )

        appointment_map = {
            appointment["id"]: appointment
            for appointment in (appointment_result.data or [])
        }

        active_entries = []

        for entry in entries:
            appointment = appointment_map.get(
                entry["appointment_id"]
            )

            if appointment:
                entry["appointment_status"] = appointment["status"]
                entry["priority"] = appointment["priority"]

            if (
                appointment
                and appointment["status"] in ACTIVE_APPOINTMENT_STATUSES
            ):
                active_entries.append(entry)

        return {
            "success": True,
            "doctor_id": doctor_id,
            "queue_date": queue_date,
            "total_entries": len(active_entries),
            "queue": active_entries
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve queue"
        )


@router.get("/patient/{appointment_id}")
def get_patient_queue_status(appointment_id: str):

    try:
        result = (
            supabase
            .table("queue_entries")
            .select(
                "id, appointment_id, doctor_id, queue_date, "
                "token_number, status, joined_at, called_at, "
                "consultation_started_at, consultation_completed_at"
            )
            .eq("appointment_id", appointment_id)
            .single()
            .execute()
        )

        patient_entry = result.data

        if not patient_entry:
            raise HTTPException(
                status_code=404,
                detail="Queue entry not found"
            )

        appointment_result = (
            supabase
            .table("appointments")
            .select("status, priority")
            .eq("id", appointment_id)
            .single()
            .execute()
        )

        appointment = appointment_result.data

        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )

        doctor_id = patient_entry["doctor_id"]
        queue_date = patient_entry["queue_date"]
        patient_token = patient_entry["token_number"]

        queue_result = (
            supabase
            .table("queue_entries")
            .select(
                "appointment_id, token_number, status"
            )
            .eq("doctor_id", doctor_id)
            .eq("queue_date", queue_date)
            .in_(
                "status",
                ["waiting", "called"]
            )
            .lt("token_number", patient_token)
            .order("token_number")
            .execute()
        )

        ahead_entries = queue_result.data or []

        people_ahead = 0

        if ahead_entries:
            ahead_ids = [
                entry["appointment_id"]
                for entry in ahead_entries
            ]

            ahead_appointments = (
                supabase
                .table("appointments")
                .select("id, status")
                .in_("id", ahead_ids)
                .execute()
            )

            active_ids = {
                appointment["id"]
                for appointment in (
                    ahead_appointments.data or []
                )
                if appointment["status"]
                in ACTIVE_APPOINTMENT_STATUSES
            }

            people_ahead = sum(
                1
                for entry in ahead_entries
                if entry["appointment_id"] in active_ids
            )

        return {
            "success": True,
            "appointment_id": appointment_id,
            "your_token": patient_token,
            "people_ahead": people_ahead,
            "status": appointment["status"],
            "priority": appointment["priority"]
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve patient queue status"
        )


@router.get("/patient/{appointment_id}/eta")
def get_patient_eta(appointment_id: str):

    try:
        # ---------------------------------------------------------
        # 1. Get patient's queue entry
        # ---------------------------------------------------------
        patient_result = (
            supabase
            .table("queue_entries")
            .select(
                "appointment_id, doctor_id, queue_date, "
                "token_number, status"
            )
            .eq("appointment_id", appointment_id)
            .single()
            .execute()
        )

        patient = patient_result.data

        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Queue entry not found"
            )

        doctor_id = patient["doctor_id"]
        queue_date = patient["queue_date"]
        patient_token = patient["token_number"]


        # ---------------------------------------------------------
        # 2. Get doctor's configured consultation time
        # ---------------------------------------------------------
        doctor_result = (
            supabase
            .table("doctors")
            .select(
                "average_consultation_minutes, is_active"
            )
            .eq("id", doctor_id)
            .single()
            .execute()
        )

        doctor = doctor_result.data

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        if not doctor["is_active"]:
            raise HTTPException(
                status_code=409,
                detail="Doctor is currently inactive"
            )

        configured_average = doctor[
            "average_consultation_minutes"
        ]

        if configured_average is None or configured_average <= 0:
            raise HTTPException(
                status_code=500,
                detail="Doctor consultation time is not configured"
            )


        # ---------------------------------------------------------
        # 3. Find patients ahead in the queue
        #
        # Include:
        # waiting
        # called
        # in_consultation
        # ---------------------------------------------------------
        ahead_result = (
            supabase
            .table("queue_entries")
            .select(
                "token_number, status"
            )
            .eq("doctor_id", doctor_id)
            .eq("queue_date", queue_date)
            .lt("token_number", patient_token)
            .in_(
                "status",
                [
                    "waiting",
                    "called",
                    "in_consultation"
                ]
            )
            .order(
                "token_number"
            )
            .execute()
        )

        patients_ahead = ahead_result.data or []

        people_ahead = len(patients_ahead)


        # ---------------------------------------------------------
        # 4. Get completed consultation history
        # ---------------------------------------------------------
        history_result = (
            supabase
            .table("queue_entries")
            .select(
                "consultation_started_at, "
                "consultation_completed_at"
            )
            .eq("doctor_id", doctor_id)
            .not_.is_(
                "consultation_started_at",
                "null"
            )
            .not_.is_(
                "consultation_completed_at",
                "null"
            )
            .execute()
        )

        history = history_result.data or []


        # ---------------------------------------------------------
        # 5. Calculate actual consultation durations
        # ---------------------------------------------------------
        from datetime import datetime

        historical_durations = []

        for entry in history:

            started = entry[
                "consultation_started_at"
            ]

            completed = entry[
                "consultation_completed_at"
            ]

            if not started or not completed:
                continue

            try:

                start_time = datetime.fromisoformat(
                    started.replace(
                        "Z",
                        "+00:00"
                    )
                )

                end_time = datetime.fromisoformat(
                    completed.replace(
                        "Z",
                        "+00:00"
                    )
                )

                duration_minutes = (
                    end_time - start_time
                ).total_seconds() / 60

                if duration_minutes > 0:
                    historical_durations.append(
                        duration_minutes
                    )

            except (ValueError, TypeError):
                continue


        # ---------------------------------------------------------
        # 6. Select ETA calculation method
        #
        # Less than 5 completed consultations:
        #     configured average
        #
        # 5 or more:
        #     historical average
        # ---------------------------------------------------------
        completed_consultations = len(
            historical_durations
        )

        if completed_consultations >= 5:

            average_minutes = (
                sum(historical_durations)
                / completed_consultations
            )

            eta_source = "historical_average"

        else:

            average_minutes = configured_average

            eta_source = "configured_average"


        # ---------------------------------------------------------
        # 7. Calculate estimated waiting time
        # ---------------------------------------------------------
        estimated_wait_minutes = (
            people_ahead * average_minutes
        )


        # ---------------------------------------------------------
        # 8. Return ETA information
        # ---------------------------------------------------------
        return {

            "success": True,

            "appointment_id": appointment_id,

            "your_token": patient_token,

            "people_ahead": people_ahead,

            "doctor_average_consultation_minutes": round(
                average_minutes,
                2
            ),

            "estimated_wait_minutes": round(
                estimated_wait_minutes,
                2
            ),

            "completed_consultations": (
                completed_consultations
            ),

            "eta_source": eta_source
        }


    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to calculate estimated waiting time"
        )
@router.post("/doctor/{doctor_id}/call-next")
def call_next_patient(
    doctor_id: str,
    queue_date: str = Query(...)
):
    try:
        result = (
            supabase
            .rpc(
                "call_next_patient",
                {
                    "p_doctor_id": doctor_id,
                    "p_queue_date": queue_date
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="No waiting patient available"
            )

        return {
            "success": True,
            "message": "Patient called successfully",
            **result.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@router.post("/patient/{appointment_id}/start-consultation")
def start_consultation(appointment_id: str):
    try:
        result = (
            supabase
            .rpc(
                "start_consultation",
                {
                    "p_appointment_id": appointment_id
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Unable to start consultation"
            )

        return {
            "success": True,
            "message": "Consultation started successfully",
            **result.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@router.post("/patient/{appointment_id}/complete-consultation")
def complete_consultation(appointment_id: str):
    try:
        result = (
            supabase
            .rpc(
                "complete_consultation",
                {
                    "p_appointment_id": appointment_id
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Unable to complete consultation"
            )

        return {
            "success": True,
            "message": "Consultation completed successfully",
            **result.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@router.post("/patient/{appointment_id}/cancel")
def cancel_appointment(appointment_id: str):
    try:
        result = (
            supabase
            .rpc(
                "cancel_appointment",
                {
                    "p_appointment_id": appointment_id
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Unable to cancel appointment"
            )

        return {
            "success": True,
            "message": "Appointment cancelled successfully",
            **result.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
@router.post("/patient/{appointment_id}/no-show")
def mark_appointment_no_show(appointment_id: str):
    try:
        result = (
            supabase
            .rpc(
                "mark_appointment_no_show",
                {
                    "p_appointment_id": appointment_id
                }
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Unable to mark appointment as no-show"
            )

        return {
            "success": True,
            "message": "Appointment marked as no-show",
            **result.data[0]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )