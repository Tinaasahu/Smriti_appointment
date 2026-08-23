"""
schemas.py
----------
Typed data classes for prediction inputs and outputs.
No framework dependency — plain Python dataclasses so Member 2 can wrap
them with Pydantic / FastAPI models independently.
"""

from dataclasses import dataclass
from typing import Literal


# ---------------------------------------------------------------------------
# Input schema
# ---------------------------------------------------------------------------

@dataclass
class PredictionInput:
    """
    All data required to compute a queue prediction.

    Attributes
    ----------
    current_token : int
        The token number currently being served by the doctor.
    patient_token : int
        The token number assigned to the patient we are predicting for.
    average_consultation_time : float
        Average minutes a single consultation takes (must be > 0).
    doctor_delay : float
        Extra delay in minutes already accumulated (>= 0).
    consultation_count : int
        Total consultations completed so far (used for confidence scoring).
    """
    current_token: int
    patient_token: int
    average_consultation_time: float
    doctor_delay: float
    consultation_count: int


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

StatusType = Literal["waiting", "currently_serving", "token_passed"]
ConfidenceType = Literal["low", "medium", "high"]


@dataclass
class PredictionOutput:
    """
    Result of a single queue prediction.

    Attributes
    ----------
    patients_ahead : int
        Number of patients the user is waiting behind (0 when being served).
    estimated_wait_minutes : float
        Estimated minutes until the patient's turn (0.0 when being served).
    estimated_appointment_time : str
        Wall-clock time (HH:MM, 24-hour) when the patient's turn is expected.
    confidence : ConfidenceType
        Reliability of the estimate: "low" | "medium" | "high".
    status : StatusType
        "waiting" | "currently_serving" | "token_passed"
    """
    patients_ahead: int
    estimated_wait_minutes: float
    estimated_appointment_time: str
    confidence: ConfidenceType
    status: StatusType

    def to_dict(self) -> dict:
        """Return a plain dict suitable for JSON serialisation."""
        return {
            "patients_ahead": self.patients_ahead,
            "estimated_wait_minutes": self.estimated_wait_minutes,
            "estimated_appointment_time": self.estimated_appointment_time,
            "confidence": self.confidence,
            "status": self.status,
        }
