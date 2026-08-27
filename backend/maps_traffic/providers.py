"""
Maps & Traffic Provider Abstraction Layer.
Defines BaseMapsProvider interface, MockProvider, GoogleMapsProvider, and OSRMProvider (OpenStreetMap Live Routing).
"""

from abc import ABC, abstractmethod
import os
import json
import logging
import ssl
import re
import urllib.request
import urllib.parse
from typing import Dict, Optional, Union, Tuple

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


def _fetch_nominatim(q: str, ctx) -> Optional[Dict[str, Union[str, float]]]:
    """Helper to execute single Nominatim query."""
    try:
        encoded = urllib.parse.quote(q.strip())
        url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "SmritiSmartQueue/1.0"})
        with urllib.request.urlopen(req, timeout=4, context=ctx) as response:
            data = json.loads(response.read().decode("utf-8"))
            if data and len(data) > 0:
                res = data[0]
                return {
                    "address": res.get("display_name", q),
                    "lat": float(res["lat"]),
                    "lng": float(res["lon"])
                }
    except Exception:
        pass
    return None


def geocode_address(query_str: str) -> Optional[Dict[str, Union[str, float]]]:
    """
    Smart Multi-Tier Progressive Geocoding Service.
    Resolves both exact queries and complex, unstructured address strings (including landmarks, 
    typos, and extra text e.g., 'Ojha Multispeciality Hospital Prayagraj, near Parvati Hospital...')
    into real-world latitude, longitude, and formatted address.
    """
    if not query_str or not query_str.strip():
        return None

    raw_query = query_str.strip()
    ctx = ssl._create_unverified_context()

    # 1. Try verbatim query first
    res = _fetch_nominatim(raw_query, ctx)
    if res:
        return res

    # 2. Try cleaned query (remove landmark noise words like 'near', 'opposite', 'behind', 'next to')
    cleaned = re.sub(r'\b(near|opposite|opp|behind|next to|above|below)\s+[^,]+', '', raw_query, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if cleaned != raw_query:
        res = _fetch_nominatim(cleaned, ctx)
        if res:
            return res

    # 3. Extract comma-separated segments & try segment + city/pincode
    parts = [p.strip() for p in raw_query.split(',') if p.strip()]
    city_pincode = ' '.join(parts[-2:]) if len(parts) >= 2 else parts[-1] if parts else ''

    for part in parts[:-1]:
        clean_part = re.sub(r'\b(near|opposite|opp|behind|next to)\b.*', '', part, flags=re.IGNORECASE).strip()
        if len(clean_part) > 3:
            candidate = f"{clean_part}, {city_pincode}"
            res = _fetch_nominatim(candidate, ctx)
            if res:
                return res

    # 4. Try pincode search
    pincode_match = re.search(r'\b\d{6}\b', raw_query)
    if pincode_match:
        candidate = f"{pincode_match.group(0)}, India"
        res = _fetch_nominatim(candidate, ctx)
        if res:
            return res

    # 5. Try main city/state segment
    if parts:
        res = _fetch_nominatim(parts[-1], ctx)
        if res:
            return res

    return None


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
        """
        pass


class OSRMProvider(BaseMapsProvider):
    """
    Live OpenStreetMap & OSRM Routing Engine Provider.
    Calculates actual road driving distance, live route duration, and peak-hour traffic multipliers.
    """

    def calculate_eta(
        self,
        patient_lat: float,
        patient_lng: float,
        clinic_lat: float,
        clinic_lng: float,
    ) -> Dict[str, Union[str, float]]:
        validate_coordinates(patient_lat, patient_lng, "Patient coordinates")
        validate_coordinates(clinic_lat, clinic_lng, "Clinic coordinates")

        try:
            ctx = ssl._create_unverified_context()
            # OSRM expects coordinates in format: longitude,latitude
            url = (
                f"http://router.project-osrm.org/route/v1/driving/"
                f"{patient_lng},{patient_lat};{clinic_lng},{clinic_lat}?"
                f"overview=false"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "SmritiSmartQueue/1.0"})

            with urllib.request.urlopen(req, timeout=6, context=ctx) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    if data.get("code") == "Ok" and data.get("routes"):
                        route = data["routes"][0]
                        distance_km = round(route["distance"] / 1000.0, 2)
                        base_duration_mins = route["duration"] / 60.0

                        # Apply live peak-hour traffic multiplier
                        status, multiplier = estimate_traffic_condition(clinic_lat, clinic_lng)
                        effective_minutes = round(base_duration_mins * multiplier, 1)

                        traffic_level = "Low" if multiplier <= 1.15 else ("Medium" if multiplier <= 1.45 else "High")

                        logger.info(
                            f"OSRMProvider live ETA: distance={distance_km}km, travel_minutes={effective_minutes}, traffic={traffic_level}"
                        )

                        return {
                            "distance_km": distance_km,
                            "travel_minutes": effective_minutes,
                            "traffic": traffic_level,
                            "traffic_level": traffic_level,
                        }
        except Exception as e:
            logger.warning(f"OSRM Routing failed: {e}. Falling back to Haversine estimate.")

        # Fallback calculation if OSRM endpoint times out
        mock = MockProvider()
        return mock.calculate_eta(patient_lat, patient_lng, clinic_lat, clinic_lng)


class MockProvider(BaseMapsProvider):
    """Fallback Mock provider using Haversine distance and peak-hour time-of-day traffic model."""

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

        ctx = ssl._create_unverified_context()
        url = (
            f"https://maps.googleapis.com/maps/api/directions/json?"
            f"origin={patient_lat},{patient_lng}&"
            f"destination={clinic_lat},{clinic_lng}&"
            f"departure_time=now&"
            f"key={urllib.parse.quote(self.api_key)}"
        )

        req = urllib.request.Request(url, headers={"User-Agent": "SmritiBackend/1.0"})
        with urllib.request.urlopen(req, timeout=8, context=ctx) as response:
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

        return {
            "distance_km": distance_km,
            "travel_minutes": travel_minutes,
            "traffic": traffic_level,
            "traffic_level": traffic_level,
        }


def get_maps_provider(mode: Optional[str] = None, api_key: Optional[str] = None) -> BaseMapsProvider:
    """
    Factory function for obtaining a maps provider instance.
    Uses Google Maps if API key present, or OSRM live routing engine automatically.
    """
    _load_env_file()
    selected_mode = (mode or os.getenv("MAPS_MODE") or "live").lower()
    key = api_key or os.getenv("GOOGLE_MAPS_API_KEY")

    if selected_mode in ("google_maps", "google") and key:
        try:
            return GoogleMapsProvider(api_key=key)
        except Exception as e:
            logger.warning(f"GoogleMapsProvider initialization failed: {e}. Falling back to OSRMProvider.")

    # Return OSRM Live OpenStreetMap Routing Engine by default
    return OSRMProvider()
