/**
 * Appointment Service
 * Connects to backend/app/routes/appointments.py
 */

import { request } from "./api";
import { INITIAL_ACTIVE_APPOINTMENT, MOCK_DOCTORS, MOCK_HOSPITAL } from "../data/mockData";

export const appointmentService = {
  /**
   * Creates a new appointment with queue token
   * Corresponds to POST /api/v1/appointments
   */
  async createAppointment({
    hospitalId,
    departmentId,
    doctorId,
    patientId,
    appointmentDate,
    scheduledStartTime,
    scheduledEndTime
  }) {
    const response = await request("/api/v1/appointments", {
      method: "POST",
      body: JSON.stringify({
        hospital_id: hospitalId,
        department_id: departmentId,
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: appointmentDate,
        scheduled_start_time: scheduledStartTime,
        scheduled_end_time: scheduledEndTime
      })
    });

    if (response && response.success) {
      return response.data;
    }

    // Mock fallback response
    const doc = MOCK_DOCTORS.find(d => d.id === doctorId) || MOCK_DOCTORS[0];
    const generatedTokenNum = 100 + Math.floor(Math.random() * 20) + 1;
    const tokenString = `TKN-${generatedTokenNum}`;

    return {
      id: `apt-${Date.now()}`,
      token_number: tokenString,
      numeric_token: generatedTokenNum,
      doctor: doc,
      hospital: MOCK_HOSPITAL,
      appointment_date: appointmentDate,
      scheduled_start_time: scheduledStartTime || "10:30 AM",
      status: "waiting",
      created_at: new Date().toISOString()
    };
  },

  /**
   * Check in an appointment
   * Corresponds to POST /api/v1/appointments/appointments/{appointment_id}/check-in
   */
  async checkInAppointment(appointmentId) {
    const response = await request(`/api/v1/appointments/appointments/${appointmentId}/check-in`, {
      method: "POST"
    });
    return response || { status: "checked_in", message: "Patient checked in successfully" };
  }
};
