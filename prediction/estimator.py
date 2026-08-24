"""
estimator.py
------------
Core rule-based prediction engine for the Smart Queue System.

This module is intentionally framework-agnostic so it can be imported
by the FastAPI backend (Member 2) or any other consumer without modification.
"""

import math
from datetime import datetime, timedelta
from typing import Union

from .schemas import PredictionInput, PredictionOutput


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _validate_inputs(
    current_token: int,
    patient_token: int,
    average_consultation_time: float,
    doctor_delay: float,
    consultation_count: int,
) -> None:
    """
    Raise ValueError for any invalid or logically impossible input.
    Checks for None, NaN, Infinity, negative-where-not-allowed values,
    and wrong types so the caller always gets a clean exception message.
    """
    fields = {
        "current_token": current_token,
        "patient_token": patient_token,
        "average_consultation_time": average_consultation_time,
        "doctor_delay": doctor_delay,
        "consultation_count": consultation_count,
    }

    for name, value in fields.items():
        if value is None:
            raise ValueError(f"{name} must not be None.")
        if not isinstance(value, (int, float)):
            raise ValueError(
                f"{name} must be a number, got {type(value).__name__}."
            )
        if isinstance(value, float) and math.isnan(value):
            raise ValueError(f"{name} must not be NaN.")
        if isinstance(value, float) and math.isinf(value):
            raise ValueError(f"{name} must not be Infinity.")

    if current_token < 0:
        raise ValueError("current_token must be >= 0.")
    if patient_token < 0:
        raise ValueError("patient_token must be >= 0.")
    if average_consultation_time <= 0:
        raise ValueError("average_consultation_time must be > 0.")
    if doctor_delay < 0:
        raise ValueError("doctor_delay must be >= 0.")
    if consultation_count < 0:
        raise ValueError("consultation_count must be >= 0.")


def _compute_confidence(consultation_count: int) -> str:
    """
    Map the number of completed consultations to a confidence tier.

      <  15  -> "low"
      15-49  -> "medium"
      50+    -> "high"
    """
    if consultation_count < 15:
        return "low"
    if consultation_count < 50:
        return "medium"
    return "high"


def _format_time(dt: datetime) -> str:
    """Return HH:MM (24-hour) string from a datetime object."""
    return dt.strftime("%H:%M")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_queue(
    current_token: int,
    patient_token: int,
    average_consultation_time: float,
    doctor_delay: float,
    consultation_count: int,
    *,
    now: Union[datetime, None] = None,
) -> PredictionOutput:
    """
    Estimate a patient's wait time and appointment slot in a live queue.

    Parameters
    ----------
    current_token : int
        Token number currently being served by the doctor (>= 0).
    patient_token : int
        Token number assigned to the patient (>= 0).
    average_consultation_time : float
        Average minutes per consultation (> 0).
    doctor_delay : float
        Accumulated extra delay in minutes (>= 0).
    consultation_count : int
        Total consultations completed today (>= 0); drives confidence level.
    now : datetime | None
        Override the current wall-clock time (useful for unit tests).
        Defaults to datetime.now() when None.

    Returns
    -------
    PredictionOutput
        Dataclass with:
          - patients_ahead          : int
          - estimated_wait_minutes  : float
          - estimated_appointment_time : str  (HH:MM)
          - confidence              : "low" | "medium" | "high"
          - status                  : "waiting" | "currently_serving" | "token_passed"

    Raises
    ------
    ValueError
        If any input fails validation (None, NaN, Infinity, out-of-range).

    Example
    -------
    >>> from datetime import datetime
    >>> result = predict_queue(
    ...     current_token=19,
    ...     patient_token=27,
    ...     average_consultation_time=8,
    ...     doctor_delay=5,
    ...     consultation_count=20,
    ...     now=datetime(2026, 8, 23, 15, 54),
    ... )
    >>> result.to_dict()
    {
        'patients_ahead': 7,
        'estimated_wait_minutes': 61.0,
        'estimated_appointment_time': '16:55',
        'confidence': 'medium',
        'status': 'waiting'
    }
    """

    # 1. Validate all inputs first ─────────────────────────────────────────
    _validate_inputs(
        current_token,
        patient_token,
        average_consultation_time,
        doctor_delay,
        consultation_count,
    )

    # 2. Reference time ────────────────────────────────────────────────────
    reference_time: datetime = now if now is not None else datetime.now()

    # 3. Confidence level ──────────────────────────────────────────────────
    confidence = _compute_confidence(int(consultation_count))

    # 4. Edge case: patient is currently being served ───────────────────────
    if patient_token == current_token:
        return PredictionOutput(
            patients_ahead=0,
            estimated_wait_minutes=0.0,
            estimated_appointment_time=_format_time(reference_time),
            confidence=confidence,
            status="currently_serving",
        )

    # 5. Edge case: patient's token has already been called ────────────────
    if patient_token < current_token:
        return PredictionOutput(
            patients_ahead=0,
            estimated_wait_minutes=0.0,
            estimated_appointment_time=_format_time(reference_time),
            confidence=confidence,
            status="token_passed",
        )

    # 6. Normal waiting path ───────────────────────────────────────────────
    #    patients_ahead is guaranteed >= 0 here (patient_token > current_token)
    patients_ahead: int = patient_token - current_token - 1

    # Core formula:
    #   estimated_wait = (patients_ahead x avg_consultation_time) + doctor_delay
    raw_wait: float = (patients_ahead * float(average_consultation_time)) + float(doctor_delay)

    # Safety guard — never expose a negative wait time
    estimated_wait_minutes: float = max(0.0, raw_wait)
    estimated_wait_minutes = round(estimated_wait_minutes, 1)

    appointment_dt: datetime = reference_time + timedelta(minutes=estimated_wait_minutes)

    return PredictionOutput(
        patients_ahead=patients_ahead,
        estimated_wait_minutes=estimated_wait_minutes,
        estimated_appointment_time=_format_time(appointment_dt),
        confidence=confidence,
        status="waiting",
    )
