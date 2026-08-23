# 📍 Maps & Traffic Module — Smriti Backend

## 🎯 Purpose
The `maps_traffic` module provides geospatial distance calculation, travel time estimation, traffic congestion assessment, departure timing recommendations ("Leave Home Time"), and routing utilities for the **Smriti** queue and appointment management system.

It supports dual operational modes with uniform response contracts:
1. **Mock Mode (Default for MVP)**: Fast, offline geospatial and traffic estimation using the Haversine distance formula and peak-hour time-of-day traffic modeling.
2. **Google Maps API Mode**: Live traffic and distance computation using the Google Maps API when configured via environment variables.

---

## 📂 Folder Structure

```
backend/maps_traffic/
├── __init__.py           # Package exports (routers, service, models, utilities)
├── router.py             # FastAPI APIRouter endpoints
├── service.py            # Business logic layer (MapsTrafficService & ETA functions)
├── models.py             # Pydantic schemas and data validation models
├── utils.py              # Geospatial math, Haversine formula, leave time logic
├── test_maps_traffic.py  # Pytest unit and integration test suite
└── README.md             # Module documentation
```

---

## 🚀 API Endpoint

### `POST /maps/eta`

Calculates distance, travel time, and traffic level between patient and clinic coordinates.

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
  "traffic": "Medium"
}
```

#### **Validation & Error Handling (`422 Unprocessable Entity`)**
Pydantic validates that latitudes are between `-90.0` and `90.0` and longitudes are between `-180.0` and `180.0`.
```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["body", "patient_lat"],
      "msg": "Input should be less than or equal to 90",
      "input": 125.4358
    }
  ]
}
```

---

## ⏰ Leave Home Calculation

Calculates recommended home departure time and total journey buffer for patient appointments.

### **Python Usage**

```python
from backend.maps_traffic import calculate_leave_time

result = calculate_leave_time(
    estimated_appointment_time="18:30",
    travel_minutes=18,
    safety_buffer_minutes=10,
)

print(result)
# Output:
# {
#   "leave_time": "18:02",
#   "total_journey_buffer_minutes": 28
# }
```

- **Formula**: `total_journey_buffer = travel_minutes + safety_buffer_minutes`
- **Departure Time**: `estimated_appointment_time - total_journey_buffer` (handles 24-hour clock and midnight roll-overs seamlessly).

---

## 🤝 Integration Instructions for Teammates

### 1. Register Router in FastAPI Application

```python
from fastapi import FastAPI
from backend.maps_traffic import maps_router, maps_traffic_router

app = FastAPI(title="Smriti Backend")

# Register /maps/eta endpoint
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
