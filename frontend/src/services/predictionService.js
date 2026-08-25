/**
 * Prediction Service
 * Consumes wait-time prediction algorithm matching prediction/estimator.py & prediction/schemas.py
 */

export const predictionService = {
  /**
   * Estimates patient wait time and expected appointment slot based on queue state.
   * Matches prediction/estimator.py logic.
   */
  calculatePrediction({
    currentToken,
    patientToken,
    averageConsultationTime = 8.0,
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

    const formatHHMM = (d) => {
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    };

    // 3. Edge Case: currently being served
    if (patientToken === currentToken) {
      return {
        patientsAhead: 0,
        estimatedWaitMinutes: 0.0,
        estimatedAppointmentTime: formatHHMM(referenceTime),
        confidence,
        status: "currently_serving"
      };
    }

    // 4. Edge Case: token has already passed
    if (patientToken < currentToken) {
      return {
        patientsAhead: 0,
        estimatedWaitMinutes: 0.0,
        estimatedAppointmentTime: formatHHMM(referenceTime),
        confidence,
        status: "token_passed"
      };
    }

    // 5. Normal Waiting Path
    const patientsAhead = Math.max(0, patientToken - currentToken - 1);
    const rawWait = (patientsAhead * Number(averageConsultationTime)) + Number(doctorDelay);
    const estimatedWaitMinutes = Math.max(0.0, Math.round(rawWait * 10) / 10);

    const appointmentDate = new Date(referenceTime.getTime() + estimatedWaitMinutes * 60000);
    const estimatedAppointmentTime = formatHHMM(appointmentDate);

    return {
      patientsAhead,
      estimatedWaitMinutes,
      estimatedAppointmentTime,
      confidence,
      status: "waiting"
    };
  }
};
