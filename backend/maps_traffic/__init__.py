"""
Maps & Traffic Module for Smriti Backend

This package handles geospatial calculations, traffic condition estimation,
routing, and appointment departure/ETA recommendations.
"""

from .router import router as maps_traffic_router, maps_router
from .service import (
    MapsTrafficService,
    calculate_travel_eta,
    calculate_maps_eta,
    calculate_leave_time,
)
from .models import (
    Coordinates,
    RouteRequest,
    RouteResponse,
    AppointmentETAQuery,
    AppointmentETAResponse,
    TrafficStatus,
    TravelETARequest,
    TravelETAResponse,
    MapsETARequest,
    MapsETAResponse,
)

__all__ = [
    "maps_traffic_router",
    "maps_router",
    "MapsTrafficService",
    "calculate_travel_eta",
    "calculate_maps_eta",
    "calculate_leave_time",
    "Coordinates",
    "RouteRequest",
    "RouteResponse",
    "AppointmentETAQuery",
    "AppointmentETAResponse",
    "TrafficStatus",
    "TravelETARequest",
    "TravelETAResponse",
    "MapsETARequest",
    "MapsETAResponse",
]



