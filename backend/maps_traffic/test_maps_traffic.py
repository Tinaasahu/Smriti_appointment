"""
Pytest unit and integration tests for the Maps & Traffic module.
Tests are kept isolated to the maps_traffic module.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.maps_traffic import (
    maps_router,
    maps_traffic_router,
    MapsTrafficService,
    calculate_maps_eta,
    calculate_travel_eta,
    calculate_leave_time,
    generate_travel_summary,
    fetch_queue_eta,
    MockProvider,
    GoogleMapsProvider,
    get_maps_provider,
    MapsETARequest,
    Coordinates,
)


@pytest.fixture
def api_client():
    app = FastAPI()
    app.include_router(maps_router)
    app.include_router(maps_traffic_router)
    return TestClient(app)


# 1. Same Location Test
def test_same_location():
    lat, lng = 25.4358, 81.8463
    result = calculate_maps_eta(
        patient_lat=lat,
        patient_lng=lng,
        clinic_lat=lat,
        clinic_lng=lng,
        mode="mock",
    )
    assert result["distance_km"] == 0.0
    assert result["travel_minutes"] == 0
    assert result["traffic"] in ["Low", "Medium", "High"]


# 2. Short Distance Test
def test_short_distance():
    # ~1.5 km apart in Prayagraj
    patient_lat, patient_lng = 25.4358, 81.8463
    clinic_lat, clinic_lng = 25.4480, 81.8542

    result = calculate_maps_eta(
        patient_lat=patient_lat,
        patient_lng=patient_lng,
        clinic_lat=clinic_lat,
        clinic_lng=clinic_lng,
        mode="mock",
    )
    assert 1.0 < result["distance_km"] < 3.0
    assert result["travel_minutes"] > 0
    assert result["traffic"] in ["Low", "Medium", "High"]


# 3. Long Distance Test
def test_long_distance():
    # New Delhi to Mumbai (~1150 km)
    delhi_lat, delhi_lng = 28.6139, 77.2090
    mumbai_lat, mumbai_lng = 19.0760, 72.8777

    result = calculate_maps_eta(
        patient_lat=delhi_lat,
        patient_lng=delhi_lng,
        clinic_lat=mumbai_lat,
        clinic_lng=mumbai_lng,
        mode="mock",
    )
    assert result["distance_km"] > 1000.0
    assert result["travel_minutes"] > 1000
    assert result["traffic"] in ["Low", "Medium", "High"]


# 4. Invalid Coordinates Test
def test_invalid_coordinates_service():
    # Latitude > 90
    with pytest.raises(ValueError, match="Latitude must be between -90.0 and 90.0 degrees"):
        calculate_travel_eta(
            patient_latitude=100.0,
            patient_longitude=77.0,
            clinic_latitude=28.0,
            clinic_longitude=77.0,
        )

    # Longitude > 180
    with pytest.raises(ValueError, match="Longitude must be between -180.0 and 180.0 degrees"):
        calculate_travel_eta(
            patient_latitude=28.0,
            patient_longitude=200.0,
            clinic_latitude=28.0,
            clinic_longitude=77.0,
        )


def test_invalid_coordinates_pydantic_schema():
    with pytest.raises(ValidationError):
        MapsETARequest(
            patient_lat=95.0,  # Invalid latitude
            patient_lng=81.8463,
            clinic_lat=25.4480,
            clinic_lng=81.8542,
        )


def test_invalid_coordinates_fastapi_endpoint(api_client):
    payload = {
        "patient_lat": 125.4358,  # Out of range latitude
        "patient_lng": 81.8463,
        "clinic_lat": 25.4480,
        "clinic_lng": 81.8542,
    }
    response = api_client.post("/maps/eta", json=payload)
    assert response.status_code == 422


# 5. Leave Time Calculation Test
def test_calculate_leave_time_standard():
    # Appointment at 18:30, 18 min travel, 10 min buffer -> Leave at 18:02
    result = calculate_leave_time(
        estimated_appointment_time="18:30",
        travel_minutes=18,
        safety_buffer_minutes=10,
    )
    assert result["leave_time"] == "18:02"
    assert result["total_journey_buffer_minutes"] == 28


def test_calculate_leave_time_parameter_names():
    # Using appointment_time and safety_buffer kwargs
    result = calculate_leave_time(
        appointment_time="14:15",
        travel_minutes=25,
        safety_buffer=15,
    )
    assert result["leave_time"] == "13:35"
    assert result["total_journey_buffer_minutes"] == 40


def test_calculate_leave_time_midnight_rollover():
    # Appointment at 00:15, 20 min travel, 10 min buffer -> Leave at 23:45
    result = calculate_leave_time(
        estimated_appointment_time="00:15",
        travel_minutes=20,
        safety_buffer_minutes=10,
    )
    assert result["leave_time"] == "23:45"
    assert result["total_journey_buffer_minutes"] == 30


def test_calculate_leave_time_invalid_time_format():
    with pytest.raises(ValueError, match="estimated_appointment_time must be in 'HH:MM' format"):
        calculate_leave_time(
            estimated_appointment_time="invalid-time",
            travel_minutes=15,
            safety_buffer_minutes=10,
        )


# FastAPI Endpoint Integration Tests
def test_fastapi_maps_eta_endpoint(api_client):
    payload = {
        "patient_lat": 25.4358,
        "patient_lng": 81.8463,
        "clinic_lat": 25.4480,
        "clinic_lng": 81.8542,
    }
    response = api_client.post("/maps/eta", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "distance_km" in data
    assert "travel_minutes" in data
    assert "traffic" in data
    assert "traffic_level" in data
    assert data["traffic"] in ["Low", "Medium", "High"]
    assert data["traffic_level"] == data["traffic"]


def test_fastapi_maps_leave_time_endpoint(api_client):
    payload = {
        "appointment_time": "18:30",
        "travel_minutes": 18,
        "safety_buffer": 10,
    }
    response = api_client.post("/maps/leave-time", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["leave_time"] == "18:02"
    assert data["total_journey_buffer_minutes"] == 28.0


def test_fastapi_maps_leave_time_endpoint_invalid_format(api_client):
    payload = {
        "appointment_time": "25:99",
        "travel_minutes": 18,
        "safety_buffer": 10,
    }
    response = api_client.post("/maps/leave-time", json=payload)
    assert response.status_code == 400
    assert "estimated_appointment_time must be in 'HH:MM' format" in response.json()["detail"]


# 6. Travel Summary & Queue Integration Tests
def test_fetch_queue_eta_service():
    res = fetch_queue_eta("A-102")
    assert res["token_number"] == "A-102"
    assert res["appointment_time"] == "18:30"


def test_generate_travel_summary_service():
    result = generate_travel_summary(
        token_number="A-102",
        appointment_time="18:30",
        patient_lat=25.4358,
        patient_lng=81.8463,
        clinic_lat=25.4480,
        clinic_lng=81.8542,
        safety_buffer=10,
    )
    assert result["token_number"] == "A-102"
    assert result["appointment_time"] == "18:30"
    assert result["distance_km"] > 0
    assert result["travel_minutes"] > 0
    assert result["traffic_level"] in ["Low", "Medium", "High"]
    assert result["leave_home_at"] == "18:16"


def test_fastapi_travel_summary_endpoint_with_queue_token(api_client):
    payload = {
        "token_number": "A-102",
        "patient_lat": 25.4358,
        "patient_lng": 81.8463,
        "clinic_lat": 25.4480,
        "clinic_lng": 81.8542,
        "safety_buffer": 10,
    }
    response = api_client.post("/maps/travel-summary", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["token_number"] == "A-102"
    assert data["appointment_time"] == "18:30"
    assert "distance_km" in data
    assert "travel_minutes" in data
    assert "traffic_level" in data
    assert data["leave_home_at"] == "18:16"



def test_fastapi_travel_summary_endpoint_invalid_coords(api_client):
    payload = {
        "token_number": "A-102",
        "appointment_time": "18:30",
        "patient_lat": 125.4358,  # Invalid latitude
        "patient_lng": 81.8463,
        "clinic_lat": 25.4480,
        "clinic_lng": 81.8542,
    }
    response = api_client.post("/maps/travel-summary", json=payload)
    assert response.status_code == 422


# 7. Provider Abstraction Tests
def test_mock_provider_eta():
    provider = MockProvider()
    res = provider.calculate_eta(25.4358, 81.8463, 25.4480, 81.8542)
    assert "distance_km" in res
    assert "travel_minutes" in res
    assert "traffic_level" in res
    assert res["traffic_level"] in ["Low", "Medium", "High"]


def test_google_maps_provider_missing_key():
    with pytest.raises(ValueError, match="GOOGLE_MAPS_API_KEY is not configured"):
        GoogleMapsProvider(api_key="")


def test_get_maps_provider_factory():
    provider_default = get_maps_provider(mode="mock")
    assert isinstance(provider_default, MockProvider)

    # When google_maps mode requested without valid key, falls back to MockProvider
    provider_fallback = get_maps_provider(mode="google_maps", api_key="")
    assert isinstance(provider_fallback, MockProvider)




