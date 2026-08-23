"""
FastAPI Router for Maps & Traffic API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from .models import (
    Coordinates,
    RouteRequest,
    RouteResponse,
    AppointmentETAQuery,
    AppointmentETAResponse,
    DistanceMatrixRequest,
    DistanceMatrixResponse,
    TrafficInfo,
    TravelETARequest,
    TravelETAResponse,
    MapsETARequest,
    MapsETAResponse,
    LeaveTimeRequest,
    LeaveTimeResponse,
    TravelSummaryRequest,
    TravelSummaryResponse,
)
from .service import MapsTrafficService

router = APIRouter(
    prefix="/maps-traffic",
    tags=["Maps & Traffic"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Resource not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
)

maps_router = APIRouter(
    prefix="/maps",
    tags=["Maps"],
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Resource not found"},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
)

# Initialize service instance (can be overridden or injected via dependency)
service = MapsTrafficService()



@router.post(
    "/route",
    response_model=RouteResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate route and traffic info",
    description="Calculates distance, base travel time, traffic delays, and route steps between two coordinates.",
)
async def calculate_route(request: RouteRequest) -> RouteResponse:
    try:
        return service.calculate_route(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating route: {str(e)}",
        )


@router.post(
    "/appointment-eta",
    response_model=AppointmentETAResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate appointment ETA and departure time",
    description="Provides patient travel ETA, recommended departure time, traffic warnings, and on-time status.",
)
async def calculate_appointment_eta(query: AppointmentETAQuery) -> AppointmentETAResponse:
    try:
        return service.calculate_appointment_eta(query)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating appointment ETA: {str(e)}",
        )


@router.post(
    "/matrix",
    response_model=DistanceMatrixResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate distance and time matrix",
    description="Computes pairwise travel times and distances for multiple origin and destination points.",
)
async def calculate_distance_matrix(request: DistanceMatrixRequest) -> DistanceMatrixResponse:
    try:
        return service.calculate_distance_matrix(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing distance matrix: {str(e)}",
        )


@router.get(
    "/traffic-status",
    response_model=TrafficInfo,
    status_code=status.HTTP_200_OK,
    summary="Get traffic status for location",
    description="Returns real-time/estimated traffic congestion status for specified coordinates.",
)
async def get_traffic_status(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    address: Optional[str] = Query(None, description="Optional address description"),
) -> TrafficInfo:
    try:
        loc = Coordinates(latitude=latitude, longitude=longitude, address=address)
        return service.get_traffic_status(loc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching traffic status: {str(e)}",
        )


@router.post(
    "/travel-eta",
    response_model=TravelETAResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Travel ETA",
    description="Returns distance in km, travel time in minutes, and traffic level (Low, Medium, High).",
)
async def get_travel_eta(request: TravelETARequest) -> TravelETAResponse:
    try:
        return service.get_travel_eta(
            patient_latitude=request.patient_latitude,
            patient_longitude=request.patient_longitude,
            clinic_latitude=request.clinic_latitude,
            clinic_longitude=request.clinic_longitude,
            mock_mode=request.mock_mode,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating travel ETA: {str(e)}",
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Module health check",
    description="Health check endpoint for the maps_traffic backend module.",
)
async def health_check():
    return {
        "status": "healthy",
        "module": "maps_traffic",
        "version": "1.0.0",
    }


@maps_router.post(
    "/eta",
    response_model=MapsETAResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Maps ETA",
    description="Returns distance_km, travel_minutes, and traffic congestion level (Low, Medium, High).",
)
async def calculate_maps_eta_endpoint(request: MapsETARequest) -> MapsETAResponse:
    try:
        return service.get_maps_eta(
            patient_lat=request.patient_lat,
            patient_lng=request.patient_lng,
            clinic_lat=request.clinic_lat,
            clinic_lng=request.clinic_lng,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating maps ETA: {str(e)}",
        )


@maps_router.post(
    "/leave-time",
    response_model=LeaveTimeResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate Leave Home Time",
    description="Calculates recommended leave time and total journey buffer given appointment time, travel minutes, and safety buffer.",
)
async def calculate_leave_time_endpoint(request: LeaveTimeRequest) -> LeaveTimeResponse:
    try:
        return service.calculate_leave_time(
            appointment_time=request.appointment_time,
            travel_minutes=request.travel_minutes,
            safety_buffer=request.safety_buffer,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating leave time: {str(e)}",
        )


@maps_router.post(
    "/travel-summary",
    response_model=TravelSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Travel Summary",
    description="Accepts appointment time from Queue module along with patient and clinic coordinates to return travel ETA and leave home time in one combined response.",
)
async def generate_travel_summary_endpoint(request: TravelSummaryRequest) -> TravelSummaryResponse:
    try:
        return service.generate_travel_summary(
            token_number=request.token_number,
            appointment_time=request.appointment_time,
            patient_lat=request.patient_lat,
            patient_lng=request.patient_lng,
            clinic_lat=request.clinic_lat,
            clinic_lng=request.clinic_lng,
            safety_buffer=request.safety_buffer,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating travel summary: {str(e)}",
        )




