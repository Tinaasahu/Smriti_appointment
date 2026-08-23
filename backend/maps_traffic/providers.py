"""
Maps & Traffic Provider Abstraction Layer.
Defines BaseMapsProvider interface, MockProvider, and GoogleMapsProvider.
"""

from abc import ABC, abstractmethod
import os
import json
import logging
import urllib.request
import urllib.parse
from typing import Dict, Optional, Union

from .utils import (
    haversine_distance,
    estimate_traffic_condition,
    validate_coordinates,
)
from .models import Coordinates, TrafficStatus

logger = logging.getLogger(__name__)


def _load_env_file() -> None:
    """Helper to load environment variables from .env if present."""
    from pathlib import Path
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


class BaseMapsProvider(ABC):
    """Abstract base class for all Maps & Traffic providers."""

    @abstractmethod
    def calculate_eta(
        self,
        patient_lat: float,
        patient_lng: float,
        clinic_lat: float,
        clinic_lng: float,
    ) -> Dict[str, Union[str, float]]:
        """
        Calculate distance, travel duration, and traffic level between two coordinates.

        Returns dict format:
        {
            "distance_km": float,
            "travel_minutes": float,
            "traffic": str ("Low", "Medium", "High"),
            "traffic_level": str ("Low", "Medium", "High")
        }
        """
        pass


class MockProvider(BaseMapsProvider):
    """Default Mock provider using Haversine distance and peak-hour time-of-day traffic model."""

    def calculate_eta(
        self,
        patient_lat: float,
        patient_lng: float,
        clinic_lat: float,
        clinic_lng: float,
    ) -> Dict[str, Union[str, float]]:
        validate_coordinates(patient_lat, patient_lng, "Patient coordinates")
        validate_coordinates(clinic_lat, clinic_lng, "Clinic coordinates")

        patient_coord = Coordinates(latitude=patient_lat, longitude=patient_lng)
        clinic_coord = Coordinates(latitude=clinic_lat, longitude=clinic_lng)

        distance_km = haversine_distance(patient_coord, clinic_coord)
        status, multiplier = estimate_traffic_condition(clinic_lat, clinic_lng)

        if status == TrafficStatus.LOW:
            traffic_level = "Low"
            traffic_factor = 1.0
        elif status == TrafficStatus.MODERATE:
            traffic_level = "Medium"
            traffic_factor = 1.25
        else:
            traffic_level = "High"
            traffic_factor = 1.70

        base_travel_time_hours = distance_km / 35.0
        travel_time_minutes = base_travel_time_hours * 60.0 * traffic_factor
        rounded_minutes = round(travel_time_minutes, 1)

        logger.info(
            f"MockProvider ETA calculated: distance={distance_km}km, travel_minutes={rounded_minutes}, traffic={traffic_level}"
        )

        return {
            "distance_km": distance_km,
            "travel_minutes": rounded_minutes,
            "traffic": traffic_level,
            "traffic_level": traffic_level,
        }


class GoogleMapsProvider(BaseMapsProvider):
    """Live Google Maps API Provider."""

    def __init__(self, api_key: Optional[str] = None):
        _load_env_file()
        self.api_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_MAPS_API_KEY is not configured.")

    def calculate_eta(
        self,
        patient_lat: float,
        patient_lng: float,
        clinic_lat: float,
        clinic_lng: float,
    ) -> Dict[str, Union[str, float]]:
        validate_coordinates(patient_lat, patient_lng, "Patient coordinates")
        validate_coordinates(clinic_lat, clinic_lng, "Clinic coordinates")

        url = (
            f"https://maps.googleapis.com/maps/api/directions/json?"
            f"origin={patient_lat},{patient_lng}&"
            f"destination={clinic_lat},{clinic_lng}&"
            f"departure_time=now&"
            f"key={urllib.parse.quote(self.api_key)}"
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

        duration_in_traffic = leg.get("duration_in_traffic", {}).get("value")
        static_duration = leg["duration"]["value"]

        effective_duration = duration_in_traffic if duration_in_traffic is not None else static_duration
        travel_minutes = round(effective_duration / 60.0, 1)

        ratio = effective_duration / max(static_duration, 1)
        if ratio <= 1.15:
            traffic_level = "Low"
        elif ratio <= 1.45:
            traffic_level = "Medium"
        else:
            traffic_level = "High"

        logger.info(
            f"GoogleMapsProvider ETA calculated: distance={distance_km}km, travel_minutes={travel_minutes}, traffic={traffic_level}"
        )

        return {
            "distance_km": distance_km,
            "travel_minutes": travel_minutes,
            "traffic": traffic_level,
            "traffic_level": traffic_level,
        }


def get_maps_provider(mode: Optional[str] = None, api_key: Optional[str] = None) -> BaseMapsProvider:
    """
    Factory function for obtaining a maps provider instance.
    Falls back to MockProvider if Google Maps API key is missing or invalid.
    """
    _load_env_file()
    selected_mode = (mode or os.getenv("MAPS_MODE") or "mock").lower()
    key = api_key or os.getenv("GOOGLE_MAPS_API_KEY")

    if selected_mode in ("google_maps", "google", "live", "routes_api"):
        if key:
            try:
                return GoogleMapsProvider(api_key=key)
            except Exception as e:
                logger.warning(f"Failed to initialize GoogleMapsProvider: {e}. Falling back to MockProvider.")
        else:
            logger.warning("GOOGLE_MAPS_API_KEY missing for google_maps mode. Falling back to MockProvider.")

    return MockProvider()
