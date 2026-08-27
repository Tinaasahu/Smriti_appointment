from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal

try:
    from prediction.estimator import predict_queue
except ImportError:
    import sys
    from pathlib import Path
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    if str(root_dir) not in sys.path:
        sys.path.insert(0, str(root_dir))
    from prediction.estimator import predict_queue

router = APIRouter(
    prefix="/smart-queue",
    tags=["Smart Queue Prediction"]
)


class PredictRequest(BaseModel):
    current_token: int = Field(..., ge=0, description="Token number currently being served")
    patient_token: int = Field(..., ge=0, description="Token number assigned to patient")
    average_consultation_time: float = Field(8.0, gt=0, description="Average minutes per consultation")
    doctor_delay: float = Field(0.0, ge=0, description="Accumulated doctor delay in minutes")
    consultation_count: int = Field(20, ge=0, description="Completed consultations today")


class PredictResponse(BaseModel):
    patients_ahead: int
    estimated_wait_minutes: float
    estimated_appointment_time: str
    confidence: Literal["low", "medium", "high"]
    status: Literal["waiting", "currently_serving", "token_passed"]


@router.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Queue Wait Time",
    description="Calculates queue wait time, estimated appointment slot time, and confidence tier based on current queue metrics."
)
def predict_queue_endpoint(request: PredictRequest) -> PredictResponse:
    try:
        result = predict_queue(
            current_token=request.current_token,
            patient_token=request.patient_token,
            average_consultation_time=request.average_consultation_time,
            doctor_delay=request.doctor_delay,
            consultation_count=request.consultation_count,
        )
        return PredictResponse(**result.to_dict())
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction engine error: {str(e)}"
        )
