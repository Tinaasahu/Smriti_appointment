# 📍 Maps & Traffic Module — Smriti Backend

## 🎯 Purpose
The `maps_traffic` module provides geospatial distance calculation, travel time estimation, traffic congestion assessment, departure timing recommendations ("Leave Home Time"), travel summaries combining Queue module estimated appointment times, and routing utilities for the **Smriti** queue and appointment management system.

It features a production-ready **Provider Abstraction Architecture**:
1. **`MockProvider` (Default for MVP)**: Fast, offline geospatial and traffic estimation using the Haversine distance formula and peak-hour time-of-day traffic modeling. Works without an external API key.
2. **`GoogleMapsProvider`**: Live traffic and distance computation using the Google Maps API when configured via `GOOGLE_MAPS_API_KEY` in environment variables.
3. **`get_maps_provider()`**: Factory function with automatic fallback to `MockProvider` if the API key is unconfigured or call fails.

---

## 🔄 Queue Module Integration Flow

The Maps & Traffic module integrates with the Queue module via token numbers (e.g., `A-102`):
1. **Queue ETA Lookup**: `fetch_queue_eta(token_number)` resolves the patient's estimated appointment time from the Queue response.
2. **Travel ETA Computation**: Calculates distance and travel duration via the active Maps provider.
3. **Leave Home Departure**: Computes the exact time the patient should leave home to arrive comfortably.
4. **Unified Output**: Returns `token_number`, `appointment_time`, `distance_km`, `travel_minutes`, `traffic_level`, and `leave_home_at` in a single response payload.

---

## 📂 Folder Structure

```
backend/maps_traffic/
├── __init__.py           # Package exports (routers, service, models, providers, utilities)
├── providers.py          # Provider Abstraction (BaseMapsProvider, MockProvider, GoogleMapsProvider)
├── router.py             # FastAPI APIRouter endpoints
├── service.py            # Business logic layer & Queue integration (MapsTrafficService & fetch_queue_eta)
├── models.py             # Pydantic schemas and OpenAPI validation models
├── utils.py              # Geospatial math, coordinate validation, leave time logic
├── test_maps_traffic.py  # Pytest unit and integration test suite
└── README.md             # Module documentation
```

---

## 🚀 API Endpoints

### 1. `POST /maps/travel-summary`

Accepts `token_number` (or `appointment_time`) alongside patient and clinic coordinates. Resolves Queue ETA and returns travel ETA and Leave Home departure time in a single unified response.

#### **Request Body**
```json
{
  "token_number": "A-102",
  "patient_lat": 25.4358,
  "patient_lng": 81.8463,
  "clinic_lat": 25.4480,
  "clinic_lng": 81.8542,
  "safety_buffer": 10.0
}
```

#### **Response Body (`200 OK`)**
```json
{
  "token_number": "A-102",
  "appointment_time": "18:30",
  "distance_km": 1.57,
  "travel_minutes": 3.7,
  "traffic_level": "Medium",
  "leave_home_at": "18:16"
}
```

---

### 2. `POST /maps/eta`

Calculates distance, travel time, and traffic congestion level between patient and clinic coordinates.

#### **Request Body**
```json
{
  "patient_lat": 25.4358,
  "patient_lng": 81.8463,
  "clinic_lat": 25.4480,
  "clinic_lng": 81.8542
}
```

#### **Response Body (`200 OK`)**
```json
{
  "distance_km": 1.57,
  "travel_minutes": 3,
  "traffic": "Medium",
  "traffic_level": "Medium"
}
```

---

### 3. `POST /maps/leave-time`

Calculates recommended home departure time and total journey buffer for patient appointments.

#### **Request Body**
```json
{
  "appointment_time": "18:30",
  "travel_minutes": 18.0,
  "safety_buffer": 10.0
}
```

#### **Response Body (`200 OK`)**
```json
{
  "leave_time": "18:02",
  "total_journey_buffer_minutes": 28.0
}
```

---

## ⏰ Travel Summary & Queue Integration Usage

### **Python Usage**

```python
from backend.maps_traffic import generate_travel_summary, fetch_queue_eta

# Fetch Queue ETA by token number
queue_data = fetch_queue_eta(token_number="A-102")
print(queue_data)  # {"token_number": "A-102", "appointment_time": "18:30"}

# Generate unified travel summary
summary = generate_travel_summary(
    token_number="A-102",
    patient_lat=25.4358,
    patient_lng=81.8463,
    clinic_lat=25.4480,
    clinic_lng=81.8542,
    safety_buffer=10,
)

print(summary)
# Output:
# {
#   "token_number": "A-102",
#   "appointment_time": "18:30",
#   "distance_km": 1.57,
#   "travel_minutes": 3.7,
#   "traffic_level": "Medium",
#   "leave_home_at": "18:16"
# }
```

- **Formula**: `total_journey_buffer = travel_minutes + safety_buffer`
- **Departure Time**: `appointment_time - total_journey_buffer` (handles 24-hour clock and midnight roll-overs seamlessly).

---

## 🛡️ Centralized Validation & Error Handling

- **Coordinate Bounds**: Validates that latitude is between `-90.0` and `90.0` and longitude is between `-180.0` and `180.0`. Invalid coordinates return `HTTP 400 Bad Request` or `HTTP 422 Unprocessable Entity`.
- **Time Format**: Validates that `appointment_time` matches `"HH:MM"` 24-hour format. Invalid format returns `HTTP 400 Bad Request`.
- **Missing API Key**: If `MAPS_MODE=google_maps` is requested without `GOOGLE_MAPS_API_KEY`, the factory automatically logs a warning and falls back to `MockProvider`.

---

## 🤝 Integration Instructions for Teammates

### 1. Register Router in FastAPI Application

```python
from fastapi import FastAPI
from backend.maps_traffic import maps_router, maps_traffic_router

app = FastAPI(title="Smriti Backend")

# Register /maps/travel-summary, /maps/eta, and /maps/leave-time endpoints
app.include_router(maps_router)

# Register /maps-traffic/* endpoints
app.include_router(maps_traffic_router)
```

### 2. Environment Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
# Mode selection: "mock" (default for MVP) or "google_maps"
MAPS_MODE=mock

# Google Maps API Key (required only if MAPS_MODE=google_maps)
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Run Unit Tests

```bash
PYTHONPATH=. python3 -m pytest backend/maps_traffic/test_maps_traffic.py -v
```
