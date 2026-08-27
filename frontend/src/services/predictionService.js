/**
 * Prediction Service
 * Consumes wait-time prediction algorithm matching prediction/estimator.py & prediction/schemas.py
 */

import { request } from "./api";

export const predictionService = {
  /**
   * Async API call to backend POST /smart-queue/predict
   */
  async getSmartQueuePrediction({
    currentToken,
    patientToken,
    averageConsultationTime = 5.0,
    doctorDelay = 0.0,
    consultationCount = 20
  }) {
    const response = await request("/smart-queue/predict", {
      method: "POST",
      body: JSON.stringify({
        current_token: currentToken,
        patient_token: patientToken,
        average_consultation_time: averageConsultationTime,
        doctor_delay: doctorDelay,
        consultation_count: consultationCount
      })
    });

    if (response) {
      return {
        patientsAhead: response.patients_ahead,
        estimatedWaitMinutes: response.estimated_wait_minutes,
        estimatedAppointmentTime: response.estimated_appointment_time,
        confidence: response.confidence,
        status: response.status
      };
    }

    // Fallback to local calculation
    return this.calculatePrediction({
      currentToken,
      patientToken,
      averageConsultationTime,
      doctorDelay,
      consultationCount
    });
  },

  /**
   * Estimates patient wait time and expected appointment slot based on queue state.
   * Matches prediction/estimator.py logic.
   */
  calculatePrediction({
    currentToken,
    patientToken,
    averageConsultationTime = 5.0,
    doctorDelay = 0.0,
    consultationCount = 20,
    referenceTime = new Date()
  }) {
    // 1. Validation
    if (currentToken < 0 || patientToken < 0) {
      throw new Error("Invalid token values");
    }

    // 2. Confidence computation (<15 low, 15-49 medium, 50+ high)
    let confidence = "low";
    if (consultationCount >= 50) {
      confidence = "high";
    } else if (consultationCount >= 15) {
      confidence = "medium";
    }

    const formatHHMM12 = (d) => {
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 becomes 12
      return `${hours}:${minutes} ${ampm}`;
    };

    // 3. Edge Case: currently being served
    if (patientToken === currentToken) {
      return {
        patientsAhead: 0,
        estimatedWaitMinutes: 0.0,
        estimatedAppointmentTime: formatHHMM12(referenceTime),
        confidence,
        status: "currently_serving"
      };
    }

    // 4. Edge Case: token has already passed
    if (patientToken < currentToken) {
      return {
        patientsAhead: 0,
        estimatedWaitMinutes: 0.0,
        estimatedAppointmentTime: formatHHMM12(referenceTime),
        confidence,
        status: "token_passed"
      };
    }

    // 5. Normal Waiting Path
    const patientsAhead = Math.max(0, patientToken - currentToken - 1);
    const rawWait = (patientsAhead * Number(averageConsultationTime)) + Number(doctorDelay);
    const estimatedWaitMinutes = Math.max(0.0, Math.round(rawWait * 10) / 10);

    const appointmentDate = new Date(referenceTime.getTime() + estimatedWaitMinutes * 60000);
    const estimatedAppointmentTime = formatHHMM12(appointmentDate);

    return {
      patientsAhead,
      estimatedWaitMinutes,
      estimatedAppointmentTime,
      confidence,
      status: "waiting"
    };
  }
};
