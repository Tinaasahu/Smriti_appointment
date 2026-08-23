"""
Smart Queue Prediction Engine
==============================
Estimates patient wait times and appointment times based on live queue data.

Usage:
    from prediction import predict_queue
    result = predict_queue(
        current_token=19,
        patient_token=27,
        average_consultation_time=8,
        doctor_delay=5,
        consultation_count=20,
    )
"""

from .estimator import predict_queue
from .schemas import PredictionInput, PredictionOutput

__all__ = ["predict_queue", "PredictionInput", "PredictionOutput"]
