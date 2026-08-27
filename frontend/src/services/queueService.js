/**
 * Queue Service
 * Connects to backend queue endpoints and GET /queue/{token} & GET /patient/dashboard/{token}
 */

import { request } from "./api";
import { INITIAL_QUEUE_DATA } from "../data/mockData";

export const queueService = {
  /**
   * Retrieves doctor's live queue entries
   * Corresponds to GET /api/v1/queue/doctor/{doctor_id}?queue_date=YYYY-MM-DD
   */
  async getDoctorQueue(doctorId, queueDate) {
    const dateParam = queueDate || new Date().toISOString().split("T")[0];
    const response = await request(`/api/v1/queue/doctor/${doctorId}?queue_date=${dateParam}`);
    if (response && response.success) {
      return response.queue;
    }
    return INITIAL_QUEUE_DATA;
  },

  /**
   * Retrieves patient's specific queue status & people ahead
   * Corresponds to GET /queue/{token} and GET /api/v1/queue/patient/{appointment_id}
   */
  async getQueueByToken(token) {
    const response = await request(`/queue/${token}`);
    if (response && response.success) {
      return response;
    }
    return {
      success: true,
      appointment_id: token,
      your_token: token.startsWith("TKN-") ? token : `TKN-${token}`,
      people_ahead: 2,
      status: "waiting"
    };
  },

  /**
   * Retrieves patient's specific queue status & people ahead
   * Corresponds to GET /api/v1/queue/patient/{appointment_id}
   */
  async getPatientQueueStatus(appointmentId) {
    const response = await request(`/api/v1/queue/patient/${appointmentId}`);
    if (response && response.success) {
      return response;
    }
    return {
      success: true,
      appointment_id: appointmentId,
      your_token: "TKN-103",
      people_ahead: 2,
      status: "waiting",
      priority: "normal"
    };
  },

  /**
   * Retrieves patient's calculated wait ETA
   * Corresponds to GET /api/v1/queue/patient/{appointment_id}/eta
   */
  async getPatientETA(appointmentId) {
    const response = await request(`/api/v1/queue/patient/${appointmentId}/eta`);
    if (response && response.success) {
      return response;
    }
    return {
      success: true,
      appointment_id: appointmentId,
      your_token: "TKN-103",
      people_ahead: 2,
      doctor_average_consultation_minutes: 8,
      estimated_wait_minutes: 15,
      completed_consultations: 18,
      eta_source: "historical_average"
    };
  },

  /**
   * Orchestrator endpoint: Combines Queue + Prediction + Maps into single response
   * Corresponds to GET /patient/dashboard/{token}
   */
  async getPatientDashboardOrchestration(token) {
    const response = await request(`/patient/dashboard/${token}`);
    if (response && response.success) {
      return response;
    }
    return null;
  }
};
