/**
 * Maps & Traffic Service
 * Corresponds directly to backend/maps_traffic (router.py, service.py, models.py, providers.py)
 * Interacts with GET /maps/geocode, POST /maps/eta, POST /maps/leave-time, and POST /maps/travel-summary
 */

import { request } from "./api";
import { MOCK_TRAVEL_INFO } from "../data/mockData";

export const mapsService = {
  /**
   * Smart Multi-Tier Geocoding: Converts any place name or long unstructured address 
   * into real-world latitude, longitude, and canonical display address.
   */
  async geocodeAddress(addressQuery) {
    if (!addressQuery || !addressQuery.trim()) return null;

    const query = addressQuery.trim();

    // 1. Try FastAPI backend /maps/geocode endpoint first
    try {
      const response = await request(`/maps/geocode?address=${encodeURIComponent(query)}`, {
        method: "GET"
      });
      if (response && response.lat && response.lng) {
        return response;
      }
    } catch (e) {
      console.warn("[mapsService] Backend geocoding notice:", e.message);
    }

    // Helper for browser Nominatim fetch
    const fetchNominatim = async (q) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
        const res = await fetch(url, { headers: { "User-Agent": "SmritiApp/1.0" } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            return {
              success: true,
              query: q,
              address: data[0].display_name,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
          }
        }
      } catch (err) {
        // ignore individual candidate errors
      }
      return null;
    };

    // 2. Direct browser progressive candidates
    let res = await fetchNominatim(query);
    if (res) return res;

    // Clean landmark noise words
    const cleaned = query.replace(/\b(near|opposite|opp|behind|next to|above|below)\s+[^,]+/gi, '').replace(/\s+/g, ' ').trim();
    if (cleaned !== query) {
      res = await fetchNominatim(cleaned);
      if (res) return res;
    }

    // Segment candidates
    const parts = query.split(',').map(p => p.trim()).filter(Boolean);
    const cityPincode = parts.length >= 2 ? parts.slice(-2).join(' ') : parts[parts.length - 1] || '';

    for (const part of parts.slice(0, -1)) {
      const cleanPart = part.replace(/\b(near|opposite|opp|behind|next to)\b.*/gi, '').trim();
      if (cleanPart.length > 3) {
        res = await fetchNominatim(`${cleanPart}, ${cityPincode}`);
        if (res) return res;
      }
    }

    // Pincode candidate
    const pincodeMatch = query.match(/\b\d{6}\b/);
    if (pincodeMatch) {
      res = await fetchNominatim(`${pincodeMatch[0]}, India`);
      if (res) return res;
    }

    // City fallback
    if (parts.length > 0) {
      res = await fetchNominatim(parts[parts.length - 1]);
      if (res) return res;
    }

    return null;
  },

  /**
   * Calculates Haversine distance in km between two GPS coordinates
   */
  calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  },

  /**
   * Calculates Maps ETA matching POST /maps/eta
   */
  async getMapsETA({
    patientLat = 28.6139,
    patientLng = 77.2090,
    clinicLat = 28.5355,
    clinicLng = 77.3910
  }) {
    const response = await request("/maps/eta", {
      method: "POST",
      body: JSON.stringify({
        patient_lat: patientLat,
        patient_lng: patientLng,
        clinic_lat: clinicLat,
        clinic_lng: clinicLng
      })
    });

    if (response) return response;

    const distanceKm = this.calculateHaversine(patientLat, patientLng, clinicLat, clinicLng) || 4.8;
    return {
      distance_km: distanceKm,
      travel_minutes: Math.round(distanceKm * 2.1),
      traffic: "Medium",
      traffic_level: "Medium"
    };
  },

  /**
   * Calculates Leave Time matching POST /maps/leave-time
   */
  async getLeaveTime({
    appointmentTime = "10:30",
    travelMinutes = 18,
    safetyBuffer = 10
  }) {
    const response = await request("/maps/leave-time", {
      method: "POST",
      body: JSON.stringify({
        appointment_time: appointmentTime,
        travel_minutes: travelMinutes,
        safety_buffer: safetyBuffer
      })
    });

    if (response) return response;

    const [h, m] = appointmentTime.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    const totalBuffer = travelMinutes + safetyBuffer;
    const leaveDate = new Date(date.getTime() - totalBuffer * 60000);
    const leaveHours = String(leaveDate.getHours()).padStart(2, '0');
    const leaveMins = String(leaveDate.getMinutes()).padStart(2, '0');

    return {
      leave_time: `${leaveHours}:${leaveMins}`,
      total_journey_buffer_minutes: totalBuffer
    };
  },

  /**
   * Calculates Travel Summary matching POST /maps/travel-summary
   */
  async getTravelSummary({
    tokenNumber = "TKN-103",
    appointmentTime = "10:30",
    patientLat = 28.6139,
    patientLng = 77.2090,
    clinicLat = 28.5355,
    clinicLng = 77.3910,
    safetyBuffer = 10
  }) {
    const response = await request("/maps/travel-summary", {
      method: "POST",
      body: JSON.stringify({
        token_number: tokenNumber,
        appointment_time: appointmentTime,
        patient_lat: patientLat,
        patient_lng: patientLng,
        clinic_lat: clinicLat,
        clinic_lng: clinicLng,
        safety_buffer: safetyBuffer
      })
    });

    if (response) return response;

    // Client-side fallback calculation matching backend logic
    const distanceKm = this.calculateHaversine(patientLat, patientLng, clinicLat, clinicLng) || 4.8;
    const baseSpeedKmh = 25.0; // average city speed
    const trafficMultiplier = 1.25; // medium traffic
    const travelMinutes = Math.round((distanceKm / baseSpeedKmh) * 60 * trafficMultiplier);

    // Calculate recommended departure time
    const [hours, mins] = appointmentTime.split(":").map(Number);
    const apptDate = new Date();
    apptDate.setHours(hours, mins, 0, 0);

    const totalBuffer = travelMinutes + safetyBuffer;
    const leaveDate = new Date(apptDate.getTime() - totalBuffer * 60000);
    const leaveHours = String(leaveDate.getHours()).padStart(2, '0');
    const leaveMins = String(leaveDate.getMinutes()).padStart(2, '0');
    const leaveHomeAt = `${leaveHours}:${leaveMins}`;

    return {
      token_number: tokenNumber,
      appointment_time: appointmentTime,
      distance_km: distanceKm,
      travel_minutes: travelMinutes,
      traffic_level: "Medium",
      leave_home_at: leaveHomeAt,
      safety_buffer: safetyBuffer,
      total_journey_buffer_minutes: totalBuffer,
      route_steps: MOCK_TRAVEL_INFO.routeSteps
    };
  },

  /**
   * Leave Now calculation comparison:
   * Compares remaining queue wait time vs travel time + safety buffer
   */
  evaluateLeaveAlert(estimatedWaitMinutes, travelMinutes, safetyBuffer = 10) {
    const totalRequiredTime = travelMinutes + safetyBuffer;
    const shouldLeaveNow = totalRequiredTime >= estimatedWaitMinutes;
    const urgency = totalRequiredTime > (estimatedWaitMinutes + 10) ? "critical" : shouldLeaveNow ? "urgent" : "normal";

    return {
      shouldLeaveNow,
      urgency,
      totalRequiredTime,
      estimatedWaitMinutes,
      travelMinutes,
      safetyBuffer,
      differenceMinutes: Math.abs(estimatedWaitMinutes - totalRequiredTime)
    };
  }
};
