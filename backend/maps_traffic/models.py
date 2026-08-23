"""
Data models and Pydantic schemas for the Maps & Traffic module.
"""

from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TransportMode(str, Enum):
    DRIVING = "driving"
    WALKING = "walking"
    BICYCLING = "bicycling"
    TRANSIT = "transit"


class TrafficStatus(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HEAVY = "heavy"
    SEVERE = "severe"


class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in degrees (-180 to 180)")
    address: Optional[str] = Field(None, description="Human-readable address or landmark name")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address": "Connaught Place, New Delhi"
            }
        }
    )



class TrafficInfo(BaseModel):
    status: TrafficStatus = Field(..., description="Overall traffic congestion level")
    speed_multiplier: float = Field(..., description="Speed multiplier factor applied (1.0 = normal)")
    delay_minutes: float = Field(..., description="Estimated traffic delay in minutes")
    summary: str = Field(..., description="Human-readable traffic condition summary")


class RouteStep(BaseModel):
    instruction: str = Field(..., description="Navigation step instruction")
    distance_km: float = Field(..., description="Step distance in kilometers")
    duration_minutes: float = Field(..., description="Estimated step duration in minutes")


class RouteRequest(BaseModel):
    origin: Coordinates = Field(..., description="Starting point coordinates")
    destination: Coordinates = Field(..., description="Ending point coordinates")
    mode: TransportMode = Field(default=TransportMode.DRIVING, description="Mode of transport")
    include_traffic: bool = Field(default=True, description="Whether to include traffic delays")


class RouteResponse(BaseModel):
    origin: Coordinates
    destination: Coordinates
    mode: TransportMode
    distance_km: float = Field(..., description="Total route distance in kilometers")
    base_duration_minutes: float = Field(..., description="Duration without traffic delays")
    total_duration_minutes: float = Field(..., description="Total duration including traffic delays")
    traffic_info: TrafficInfo
    steps: List[RouteStep] = Field(default_factory=list, description="Turn-by-turn route steps")


class AppointmentETAQuery(BaseModel):
    patient_location: Coordinates = Field(..., description="Current location of the patient")
    clinic_location: Coordinates = Field(..., description="Location of the clinic/doctor")
    appointment_time: datetime = Field(..., description="Scheduled appointment datetime")
    mode: TransportMode = Field(default=TransportMode.DRIVING, description="Mode of transport")
    buffer_minutes: int = Field(default=15, description="Desired arrival buffer before appointment (in minutes)")


class AppointmentETAResponse(BaseModel):
    patient_location: Coordinates
    clinic_location: Coordinates
    distance_km: float
    travel_duration_minutes: float
    traffic_status: TrafficStatus
    recommended_departure_time: datetime
    appointment_time: datetime
    is_on_track: bool = Field(..., description="True if patient can make it on time if leaving now")
    status_message: str = Field(..., description="Actionable recommendation message for the user")


class DistanceMatrixItem(BaseModel):
    origin: Coordinates
    destination: Coordinates
    distance_km: float
    duration_minutes: float
    traffic_status: TrafficStatus


class DistanceMatrixRequest(BaseModel):
    origins: List[Coordinates]
    destinations: List[Coordinates]
    mode: TransportMode = Field(default=TransportMode.DRIVING)


class DistanceMatrixResponse(BaseModel):
    matrix: List[DistanceMatrixItem]


class TravelETARequest(BaseModel):
    patient_latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude of the patient")
    patient_longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude of the patient")
    clinic_latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude of the clinic")
    clinic_longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude of the clinic")
    mock_mode: bool = Field(default=True, description="Enable mock mode calculations")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "patient_latitude": 28.6139,
                "patient_longitude": 77.2090,
                "clinic_latitude": 28.5355,
                "clinic_longitude": 77.3910,
                "mock_mode": True
            }
        }
    )


class TravelETAResponse(BaseModel):
    distance_km: float = Field(..., description="Distance between patient and clinic in kilometers")
    travel_time_minutes: float = Field(..., description="Estimated travel time in minutes")
    traffic_level: str = Field(..., description="Traffic congestion level (Low, Medium, High)")


class MapsETARequest(BaseModel):
    patient_lat: float = Field(..., ge=-90.0, le=90.0, description="Patient latitude (-90 to 90)")
    patient_lng: float = Field(..., ge=-180.0, le=180.0, description="Patient longitude (-180 to 180)")
    clinic_lat: float = Field(..., ge=-90.0, le=90.0, description="Clinic latitude (-90 to 90)")
    clinic_lng: float = Field(..., ge=-180.0, le=180.0, description="Clinic longitude (-180 to 180)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "patient_lat": 25.4358,
                "patient_lng": 81.8463,
                "clinic_lat": 25.4480,
                "clinic_lng": 81.8542
            }
        }
    )


class MapsETAResponse(BaseModel):
    distance_km: float = Field(..., description="Distance in kilometers")
    travel_minutes: float = Field(..., description="Travel time in minutes")
    traffic: str = Field(..., description="Traffic congestion level (Low, Medium, High)")
    traffic_level: str = Field(..., description="Traffic congestion level (Low, Medium, High)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "distance_km": 4.8,
                "travel_minutes": 18,
                "traffic": "Medium",
                "traffic_level": "Medium"
            }
        }
    )


class LeaveTimeRequest(BaseModel):
    appointment_time: str = Field(..., description="Scheduled appointment time in HH:MM format (24-hour)")
    travel_minutes: float = Field(..., ge=0, description="Estimated travel time in minutes")
    safety_buffer: float = Field(default=10.0, ge=0, description="Safety buffer in minutes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "appointment_time": "18:30",
                "travel_minutes": 18.0,
                "safety_buffer": 10.0
            }
        }
    )


class LeaveTimeResponse(BaseModel):
    leave_time: str = Field(..., description="Recommended leave time in HH:MM format (24-hour)")
    total_journey_buffer_minutes: float = Field(..., description="Total travel time plus safety buffer in minutes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "leave_time": "18:02",
                "total_journey_buffer_minutes": 28.0
            }
        }
    )




