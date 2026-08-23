"""
Utility functions for geospatial computations, distance formulas, and traffic estimation.
"""

import math
from datetime import datetime, timedelta
from typing import Tuple, Optional
from .models import Coordinates, TrafficStatus, TransportMode


# Average speed in km/h by mode of transport
SPEED_PROFILES_KMH = {
    TransportMode.DRIVING: 35.0,     # City driving average speed
    TransportMode.WALKING: 4.8,      # Average walking speed
    TransportMode.BICYCLING: 15.0,   # Average bicycling speed
    TransportMode.TRANSIT: 22.0,     # Public transit average speed
}

# Traffic delay multipliers
TRAFFIC_MULTIPLIERS = {
    TrafficStatus.LOW: 1.0,
    TrafficStatus.MODERATE: 1.25,
    TrafficStatus.HEAVY: 1.60,
    TrafficStatus.SEVERE: 2.10,
}


def haversine_distance(coord1: Coordinates, coord2: Coordinates) -> float:
    """
    Calculate the great circle distance between two points 
    on the Earth using the Haversine formula (in kilometers).
    """
    EARTH_RADIUS_KM = 6371.0

    lat1 = math.radians(coord1.latitude)
    lon1 = math.radians(coord1.longitude)
    lat2 = math.radians(coord2.latitude)
    lon2 = math.radians(coord2.longitude)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = EARTH_RADIUS_KM * c
    return round(distance, 2)


def estimate_traffic_condition(lat: float, lon: float) -> Tuple[TrafficStatus, float]:
    """
    Simulate/estimate real-time traffic conditions based on time-of-day peak hours
    and location characteristics. Ready to be replaced by live API integration.
    """
    now = datetime.now()
    hour = now.hour

    # Peak rush hours: 8:00 - 10:30 AM and 5:00 - 8:00 PM
    is_morning_peak = 8 <= hour <= 10
    is_evening_peak = 17 <= hour <= 20

    if is_morning_peak or is_evening_peak:
        # Determine based on coordinate hash for determinism in mock mode
        hash_val = int((abs(lat) + abs(lon)) * 100) % 3
        if hash_val == 0:
            status = TrafficStatus.SEVERE
        elif hash_val == 1:
            status = TrafficStatus.HEAVY
        else:
            status = TrafficStatus.MODERATE
    elif 11 <= hour <= 16:
        status = TrafficStatus.MODERATE
    else:
        status = TrafficStatus.LOW

    multiplier = TRAFFIC_MULTIPLIERS[status]
    return status, multiplier


def calculate_travel_duration(
    distance_km: float, 
    mode: TransportMode, 
    traffic_status: TrafficStatus = TrafficStatus.LOW
) -> Tuple[float, float, float]:
    """
    Calculate base travel duration and traffic-adjusted duration in minutes.
    
    Returns:
        (base_duration_minutes, total_duration_minutes, delay_minutes)
    """
    base_speed = SPEED_PROFILES_KMH.get(mode, 35.0)
    base_duration_hours = distance_km / base_speed
    base_duration_minutes = base_duration_hours * 60.0

    multiplier = TRAFFIC_MULTIPLIERS.get(traffic_status, 1.0) if mode == TransportMode.DRIVING else 1.0
    total_duration_minutes = base_duration_minutes * multiplier
    delay_minutes = total_duration_minutes - base_duration_minutes

    return (
        round(base_duration_minutes, 1),
        round(total_duration_minutes, 1),
        round(delay_minutes, 1),
    )


def compute_recommended_departure(
    appointment_time: datetime,
    travel_duration_minutes: float,
    buffer_minutes: int = 15
) -> datetime:
    """
    Compute the recommended departure datetime to arrive buffer_minutes before appointment.
    """
    total_lead_time_minutes = travel_duration_minutes + buffer_minutes
    departure_time = appointment_time - timedelta(minutes=total_lead_time_minutes)
    return departure_time


def generate_mock_steps(origin: Coordinates, destination: Coordinates, mode: TransportMode, distance_km: float) -> list:
    """
    Generate turn-by-turn route steps for mock routing.
    """
    origin_name = origin.address or f"({origin.latitude:.4f}, {origin.longitude:.4f})"
    dest_name = destination.address or f"({destination.latitude:.4f}, {destination.longitude:.4f})"

    step_1_dist = round(distance_km * 0.2, 2)
    step_2_dist = round(distance_km * 0.6, 2)
    step_3_dist = round(distance_km * 0.2, 2)

    speed = SPEED_PROFILES_KMH.get(mode, 35.0)

    return [
        {
            "instruction": f"Head toward main road from {origin_name}",
            "distance_km": step_1_dist,
            "duration_minutes": round((step_1_dist / speed) * 60, 1),
        },
        {
            "instruction": f"Continue straight via primary route towards {dest_name}",
            "distance_km": step_2_dist,
            "duration_minutes": round((step_2_dist / speed) * 60, 1),
        },
        {
            "instruction": f"Arrive at destination: {dest_name}",
            "distance_km": step_3_dist,
            "duration_minutes": round((step_3_dist / speed) * 60, 1),
        },
    ]


def calculate_leave_time(
    appointment_time: Optional[str] = None,
    travel_minutes: float = 0.0,
    safety_buffer: float = 10.0,
    estimated_appointment_time: Optional[str] = None,
    safety_buffer_minutes: Optional[float] = None,
) -> dict:
    """
    Calculate recommended home departure time and total journey buffer.

    Args:
        appointment_time (str, optional): Scheduled appointment time in "HH:MM" format (24-hour).
        travel_minutes (float): Travel duration in minutes.
        safety_buffer (float): Safety buffer in minutes (default 10).
        estimated_appointment_time (str, optional): Alias for appointment_time.
        safety_buffer_minutes (float, optional): Alias for safety_buffer.

    Returns:
        dict: {
            "leave_time": str,  # e.g. "18:02"
            "total_journey_buffer_minutes": float  # travel_minutes + safety_buffer
        }
    """
    appt_str = appointment_time or estimated_appointment_time
    if not appt_str:
        raise ValueError("appointment_time must be provided in 'HH:MM' format.")

    buf = safety_buffer if safety_buffer_minutes is None else safety_buffer_minutes

    try:
        appt_time = datetime.strptime(appt_str, "%H:%M")
    except ValueError:
        raise ValueError("estimated_appointment_time must be in 'HH:MM' format.")

    total_buffer = travel_minutes + buf
    leave_dt = appt_time - timedelta(minutes=total_buffer)
    leave_time_str = leave_dt.strftime("%H:%M")

    return {
        "leave_time": leave_time_str,
        "total_journey_buffer_minutes": round(total_buffer, 1),
    }


