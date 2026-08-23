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
    generate_travel_summary,
    fetch_queue_eta,
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
    LeaveTimeRequest,
    LeaveTimeResponse,
    TravelSummaryRequest,
    TravelSummaryResponse,
    QueueETAResponse,
)

from .providers import (
    BaseMapsProvider,
    MockProvider,
    GoogleMapsProvider,
    get_maps_provider,
)

__all__ = [
    "maps_traffic_router",
    "maps_router",
    "MapsTrafficService",
    "calculate_travel_eta",
    "calculate_maps_eta",
    "calculate_leave_time",
    "generate_travel_summary",
    "fetch_queue_eta",
    "BaseMapsProvider",
    "MockProvider",
    "GoogleMapsProvider",
    "get_maps_provider",
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
    "LeaveTimeRequest",
    "LeaveTimeResponse",
    "TravelSummaryRequest",
    "TravelSummaryResponse",
    "QueueETAResponse",
]



