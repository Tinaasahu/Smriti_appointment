from datetime import date, time
from uuid import UUID

from pydantic import BaseModel


class CreateAppointmentRequest(BaseModel):
    hospital_id: UUID
    department_id: UUID
    doctor_id: UUID
    patient_id: UUID
    appointment_date: date
    scheduled_start_time: time | None = None
    scheduled_end_time: time | None = None