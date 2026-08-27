/**
 * Appointment Service
 * Connects to backend/app/routes/appointments.py and POST /appointments/book
 */

import { request } from "./api";
import { MOCK_DOCTORS, MOCK_HOSPITAL } from "../data/mockData";

export const appointmentService = {
  /**
   * Creates a new appointment with queue token
   * Corresponds to POST /appointments/book and POST /api/v1/appointments
   */
  async createAppointment({
    hospitalId = "00000000-0000-0000-0000-000000000001",
    departmentId = "00000000-0000-0000-0000-000000000001",
    doctorId = "00000000-0000-0000-0000-000000000001",
    patientId = "00000000-0000-0000-0000-000000000001",
    appointmentDate,
    scheduledStartTime,
    scheduledEndTime
  }) {
    const formattedDate = appointmentDate || new Date().toISOString().split("T")[0];

    const response = await request("/appointments/book", {
      method: "POST",
      body: JSON.stringify({
        hospital_id: hospitalId,
        department_id: departmentId,
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: formattedDate,
        scheduled_start_time: scheduledStartTime,
        scheduled_end_time: scheduledEndTime
      })
    });

    if (response && response.success) {
      return response.data;
    }

    // Mock fallback response matching database model
    const doc = MOCK_DOCTORS.find(d => d.id === doctorId) || MOCK_DOCTORS[0];
    const generatedTokenNum = 100 + Math.floor(Math.random() * 15) + 1;
    const tokenString = `TKN-${generatedTokenNum}`;

    return {
      id: `apt-${Date.now()}`,
      token_number: tokenString,
      numeric_token: generatedTokenNum,
      doctor: doc,
      hospital: MOCK_HOSPITAL,
      appointment_date: formattedDate,
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
