"""
Business logic service layer for Maps & Traffic operations.
Supports dual operational modes:
  1. Mock Mode (default for MVP)
  2. Google Maps API Mode (reads GOOGLE_MAPS_API_KEY from environment/.env)
"""

import os
import json
import logging
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

from .models import (
    Coordinates,
    RouteRequest,
    RouteResponse,
    RouteStep,
    TrafficInfo,
    TrafficStatus,
    AppointmentETAQuery,
    AppointmentETAResponse,
    DistanceMatrixRequest,
    DistanceMatrixResponse,
    DistanceMatrixItem,
    TravelETARequest,
    TravelETAResponse,
    MapsETARequest,
    MapsETAResponse,
)
from .utils import (
    haversine_distance,
    estimate_traffic_condition,
    calculate_travel_duration,
    compute_recommended_departure,
    generate_mock_steps,
    calculate_leave_time,
    TRAFFIC_MULTIPLIERS,
)

logger = logging.getLogger(__name__)


def _load_env_file() -> None:
    """
    Helper function to load environment variables from .env file 
    if python-dotenv is not installed.
    """
    possible_paths = [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]
    for env_path in possible_paths:
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))
            break


def fetch_google_maps_eta(
    patient_lat: float,
    patient_lng: float,
    clinic_lat: float,
    clinic_lng: float,
    api_key: str,
) -> dict:
    """
    Fetch distance, travel duration, and traffic congestion level from Google Maps API.

    Returns dict matching:
    {
        "distance_km": float,
        "travel_minutes": float,
        "traffic": str ("Low", "Medium", "High")
    }
    """
    url = (
        f"https://maps.googleapis.com/maps/api/directions/json?"
        f"origin={patient_lat},{patient_lng}&"
        f"destination={clinic_lat},{clinic_lng}&"
        f"departure_time=now&"
        f"key={urllib.parse.quote(api_key)}"
    )

    req = urllib.request.Request(url, headers={"User-Agent": "SmritiBackend/1.0"})
    
    with urllib.request.urlopen(req, timeout=8) as response:
        if response.status != 200:
            raise RuntimeError(f"Google Maps API HTTP status error: {response.status}")
        
        data = json.loads(response.read().decode("utf-8"))

    if data.get("status") != "OK" or not data.get("routes"):
        error_msg = data.get("error_message") or data.get("status") or "No route found"
        raise RuntimeError(f"Google Maps API error: {error_msg}")

    leg = data["routes"][0]["legs"][0]
    distance_meters = leg["distance"]["value"]
    distance_km = round(distance_meters / 1000.0, 2)

    # Use duration_in_traffic if available, else static duration
    duration_in_traffic = leg.get("duration_in_traffic", {}).get("value")
    static_duration = leg["duration"]["value"]

    effective_duration = duration_in_traffic if duration_in_traffic is not None else static_duration
    travel_minutes = round(effective_duration / 60.0, 1)

    # Calculate traffic level based on delay ratio
    ratio = effective_duration / max(static_duration, 1)
    if ratio <= 1.15:
        traffic_level = "Low"
    elif ratio <= 1.45:
        traffic_level = "Medium"
    else:
        traffic_level = "High"

    return {
        "distance_km": distance_km,
        "travel_minutes": travel_minutes,
        "traffic": traffic_level,
    }


def calculate_maps_eta(
    patient_lat: float,
    patient_lng: float,
    clinic_lat: float,
    clinic_lng: float,
    mode: Optional[str] = None,
) -> dict:
    """
    Calculate maps ETA supporting dual modes:
      1. Mock mode (default for MVP)
      2. Google Maps API mode using GOOGLE_MAPS_API_KEY from environment/.env

    Returns identical response format for both modes:
    {
        "distance_km": float,
        "travel_minutes": float,
        "traffic": str ("Low", "Medium", "High")
    }
    """
    _load_env_file()
    selected_mode = (mode or os.getenv("MAPS_MODE") or "mock").lower()
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if selected_mode in ("google_maps", "google", "live", "routes_api") and api_key:
        try:
            return fetch_google_maps_eta(patient_lat, patient_lng, clinic_lat, clinic_lng, api_key)
        except Exception as e:
            logger.warning(f"Google Maps API call failed: {e}. Falling back to mock mode.")

    # Default Mock Mode (MVP)
    res = calculate_travel_eta(
        patient_latitude=patient_lat,
        patient_longitude=patient_lng,
        clinic_latitude=clinic_lat,
        clinic_longitude=clinic_lng,
        mock_mode=True,
    )
    return {
        "distance_km": res["distance_km"],
        "travel_minutes": round(res["travel_time_minutes"]),
        "traffic": res["traffic_level"],
    }


def calculate_travel_eta(
    patient_latitude: float,
    patient_longitude: float,
    clinic_latitude: float,
    clinic_longitude: float,
    mock_mode: bool = True,
    mode: Optional[str] = None,
) -> dict:
    """
    Calculate travel ETA service function.

    Inputs:
        patient_latitude (float): Latitude of patient location
        patient_longitude (float): Longitude of patient location
        clinic_latitude (float): Latitude of clinic location
        clinic_longitude (float): Longitude of clinic location
        mock_mode (bool): If True, defaults to mock mode
        mode (str, optional): "mock" or "google_maps"

    Returns:
        dict: {
            "distance_km": float,
            "travel_time_minutes": float,
            "traffic_level": str ("Low", "Medium", "High")
        }
    """
    if not (-90.0 <= patient_latitude <= 90.0 and -90.0 <= clinic_latitude <= 90.0):
        raise ValueError("Latitude must be between -90.0 and 90.0 degrees.")
    if not (-180.0 <= patient_longitude <= 180.0 and -180.0 <= clinic_longitude <= 180.0):
        raise ValueError("Longitude must be between -180.0 and 180.0 degrees.")

    _load_env_file()
    selected_mode = (mode or os.getenv("MAPS_MODE") or ("mock" if mock_mode else "google_maps")).lower()
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if selected_mode in ("google_maps", "google", "live", "routes_api") and api_key:
        try:
            gmaps_res = fetch_google_maps_eta(
                patient_latitude, patient_longitude, clinic_latitude, clinic_longitude, api_key
            )
            return {
                "distance_km": gmaps_res["distance_km"],
                "travel_time_minutes": gmaps_res["travel_minutes"],
                "traffic_level": gmaps_res["traffic"],
            }
        except Exception as e:
            logger.warning(f"Google Maps API call failed: {e}. Falling back to mock mode.")

    # Default Mock Mode (MVP)
    patient_coord = Coordinates(latitude=patient_latitude, longitude=patient_longitude)
    clinic_coord = Coordinates(latitude=clinic_latitude, longitude=clinic_longitude)

    distance_km = haversine_distance(patient_coord, clinic_coord)
    status, multiplier = estimate_traffic_condition(clinic_latitude, clinic_longitude)

    if status == TrafficStatus.LOW:
        traffic_level = "Low"
        traffic_factor = 1.0
    elif status == TrafficStatus.MODERATE:
        traffic_level = "Medium"
        traffic_factor = 1.25
    else:  # HEAVY or SEVERE
        traffic_level = "High"
        traffic_factor = 1.70

    base_travel_time_hours = distance_km / 35.0
    travel_time_minutes = base_travel_time_hours * 60.0 * traffic_factor

    return {
        "distance_km": round(distance_km, 2),
        "travel_time_minutes": round(travel_time_minutes, 1),
        "traffic_level": traffic_level,
    }


class MapsTrafficService:
    """
    Service class handling route planning, traffic estimations, and 
    appointment departure recommendations. Supports both Mock mode and 
    Google Maps Routes API mode.
    """

    def __init__(self, api_key: Optional[str] = None, mode: Optional[str] = None):
        _load_env_file()
        self.api_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY")
        self.mode = (mode or os.getenv("MAPS_MODE") or "mock").lower()

    def calculate_route(self, request: RouteRequest) -> RouteResponse:
        """
        Calculate route distance, estimated travel time, traffic delays, and steps.
        """
        distance = haversine_distance(request.origin, request.destination)

        if request.include_traffic and request.mode == request.mode.DRIVING:
            status, multiplier = estimate_traffic_condition(
                request.destination.latitude, request.destination.longitude
            )
        else:
            status = TrafficStatus.LOW
            multiplier = 1.0

        base_duration, total_duration, delay = calculate_travel_duration(
            distance_km=distance,
            mode=request.mode,
            traffic_status=status if request.include_traffic else TrafficStatus.LOW,
        )

        traffic_info = TrafficInfo(
            status=status,
            speed_multiplier=multiplier,
            delay_minutes=delay,
            summary=f"Traffic is currently {status.value.upper()}. Delay: {delay} min.",
        )

        mock_step_data = generate_mock_steps(
            origin=request.origin,
            destination=request.destination,
            mode=request.mode,
            distance_km=distance,
        )

        steps = [RouteStep(**s) for s in mock_step_data]

        return RouteResponse(
            origin=request.origin,
            destination=request.destination,
            mode=request.mode,
            distance_km=distance,
            base_duration_minutes=base_duration,
            total_duration_minutes=total_duration,
            traffic_info=traffic_info,
            steps=steps,
        )

    def calculate_appointment_eta(self, query: AppointmentETAQuery) -> AppointmentETAResponse:
        """
        Calculate travel ETA for a patient heading to their scheduled appointment,
        providing departure recommendation and timing alerts.
        """
        distance = haversine_distance(query.patient_location, query.clinic_location)
        status, multiplier = estimate_traffic_condition(
            query.clinic_location.latitude, query.clinic_location.longitude
        )

        _, total_duration, _ = calculate_travel_duration(
            distance_km=distance,
            mode=query.mode,
            traffic_status=status,
        )

        rec_departure = compute_recommended_departure(
            appointment_time=query.appointment_time,
            travel_duration_minutes=total_duration,
            buffer_minutes=query.buffer_minutes,
        )

        now = datetime.now(query.appointment_time.tzinfo or None)
        is_on_track = now <= rec_departure

        if is_on_track:
            minutes_until_departure = round((rec_departure - now).total_seconds() / 60)
            status_msg = (
                f"You are on schedule. Leave by {rec_departure.strftime('%H:%M')} "
                f"(in approx {minutes_until_departure} min) to arrive {query.buffer_minutes} min early."
            )
        else:
            minutes_late = round((now - rec_departure).total_seconds() / 60)
            status_msg = (
                f"Warning: Traffic is {status.value.upper()}. You should leave immediately to avoid "
                f"being late for your appointment! (Recommended departure was {rec_departure.strftime('%H:%M')})."
            )

        return AppointmentETAResponse(
            patient_location=query.patient_location,
            clinic_location=query.clinic_location,
            distance_km=distance,
            travel_duration_minutes=total_duration,
            traffic_status=status,
            recommended_departure_time=rec_departure,
            appointment_time=query.appointment_time,
            is_on_track=is_on_track,
            status_message=status_msg,
        )

    def calculate_distance_matrix(self, request: DistanceMatrixRequest) -> DistanceMatrixResponse:
        """
        Compute pairwise distance and travel duration matrix for lists of origins and destinations.
        """
        items: List[DistanceMatrixItem] = []

        for origin in request.origins:
            for dest in request.destinations:
                dist = haversine_distance(origin, dest)
                status, _ = estimate_traffic_condition(dest.latitude, dest.longitude)
                _, total_dur, _ = calculate_travel_duration(dist, request.mode, status)

                items.append(
                    DistanceMatrixItem(
                        origin=origin,
                        destination=dest,
                        distance_km=dist,
                        duration_minutes=total_dur,
                        traffic_status=status,
                    )
                )

        return DistanceMatrixResponse(matrix=items)

    def get_traffic_status(self, location: Coordinates) -> TrafficInfo:
        """
        Fetch real-time traffic status for a specific location.
        """
        status, multiplier = estimate_traffic_condition(location.latitude, location.longitude)
        delay = (multiplier - 1.0) * 10.0

        return TrafficInfo(
            status=status,
            speed_multiplier=multiplier,
            delay_minutes=round(delay, 1),
            summary=f"Current traffic at ({location.latitude:.4f}, {location.longitude:.4f}) is {status.value.upper()}.",
        )

    def get_travel_eta(
        self,
        patient_latitude: float,
        patient_longitude: float,
        clinic_latitude: float,
        clinic_longitude: float,
        mock_mode: bool = True,
    ) -> TravelETAResponse:
        """
        Travel ETA service method returning TravelETAResponse model.
        """
        result = calculate_travel_eta(
            patient_latitude=patient_latitude,
            patient_longitude=patient_longitude,
            clinic_latitude=clinic_latitude,
            clinic_longitude=clinic_longitude,
            mock_mode=mock_mode,
            mode=self.mode,
        )
        return TravelETAResponse(**result)

    def get_maps_eta(
        self,
        patient_lat: float,
        patient_lng: float,
        clinic_lat: float,
        clinic_lng: float,
    ) -> MapsETAResponse:
        """
        Calculate maps ETA returning MapsETAResponse model.
        """
        result = calculate_maps_eta(
            patient_lat=patient_lat,
            patient_lng=patient_lng,
            clinic_lat=clinic_lat,
            clinic_lng=clinic_lng,
            mode=self.mode,
        )
        return MapsETAResponse(**result)

    def calculate_leave_time(
        self,
        estimated_appointment_time: str,
        travel_minutes: float,
        safety_buffer_minutes: float = 10,
    ) -> dict:
        """
        Calculate recommended departure time and total journey buffer.
        """
        return calculate_leave_time(
            estimated_appointment_time=estimated_appointment_time,
            travel_minutes=travel_minutes,
            safety_buffer_minutes=safety_buffer_minutes,
        )
