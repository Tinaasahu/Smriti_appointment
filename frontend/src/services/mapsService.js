/**
 * Maps & Traffic Service
 * Corresponds directly to backend/maps_traffic (router.py, service.py, models.py)
 */

import { request } from "./api";
import { MOCK_TRAVEL_INFO } from "../data/mockData";

export const mapsService = {
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

    // Calculate recommended departure time: appointmentTime - (travelMinutes + safetyBuffer)
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
