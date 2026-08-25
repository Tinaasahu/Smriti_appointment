import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { INITIAL_ACTIVE_APPOINTMENT, INITIAL_QUEUE_DATA, MOCK_DOCTORS, MOCK_TRAVEL_INFO } from "../data/mockData";
import { predictionService } from "../services/predictionService";
import { mapsService } from "../services/mapsService";

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [activeAppointment, setActiveAppointment] = useState(() => {
    const saved = localStorage.getItem("smriti_active_appointment");
    return saved ? JSON.parse(saved) : INITIAL_ACTIVE_APPOINTMENT;
  });

  const [queueList, setQueueList] = useState(INITIAL_QUEUE_DATA);
  const [currentTokenNumber, setCurrentTokenNumber] = useState(102); // 102 is currently serving Sita Verma
  const [travelData, setTravelData] = useState(MOCK_TRAVEL_INFO);
  const [safetyBuffer, setSafetyBuffer] = useState(10); // 10 minutes buffer

  // Save active appointment changes to localStorage
  useEffect(() => {
    if (activeAppointment) {
      localStorage.setItem("smriti_active_appointment", JSON.stringify(activeAppointment));
    }
  }, [activeAppointment]);

  // Derive Prediction Output matching prediction/estimator.py
  const prediction = useMemo(() => {
    if (!activeAppointment) return null;
    const patientTokenNum = activeAppointment.numericToken || 103;
    const avgConsult = activeAppointment.doctor?.averageConsultationMinutes || 8.0;

    return predictionService.calculatePrediction({
      currentToken: currentTokenNumber,
      patientToken: patientTokenNum,
      averageConsultationTime: avgConsult,
      doctorDelay: 2.0, // slight doctor delay simulation
      consultationCount: 22
    });
  }, [activeAppointment, currentTokenNumber]);

  // Derive Leave Alert evaluation
  const leaveAlert = useMemo(() => {
    if (!prediction) return null;
    const travelMins = travelData.travelMinutes || 18;
    return mapsService.evaluateLeaveAlert(
      prediction.estimatedWaitMinutes,
      travelMins,
      safetyBuffer
    );
  }, [prediction, travelData, safetyBuffer]);

  // Booking a new appointment
  const bookAppointment = ({ doctor, date, time, hospital }) => {
    const randomTokenNum = 100 + Math.floor(Math.random() * 20) + 1;
    const newApt = {
      id: `apt-${Date.now()}`,
      tokenNumber: `TKN-${randomTokenNum}`,
      numericToken: randomTokenNum,
      doctor: doctor || MOCK_DOCTORS[0],
      hospital: hospital || activeAppointment.hospital,
      date: date || "Tomorrow",
      rawDate: new Date().toISOString().split("T")[0],
      time: time || "10:30 AM",
      status: "waiting",
      priority: "normal",
      createdAt: new Date().toISOString(),
      patientLocation: MOCK_TRAVEL_INFO.patientLocation
    };

    setActiveAppointment(newApt);

    // Update queue list with the new appointment if not present
    setQueueList((prev) => {
      const exists = prev.some(item => item.tokenNumber === newApt.tokenNumber);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `q-${randomTokenNum}`,
          tokenNumber: newApt.tokenNumber,
          numericToken: randomTokenNum,
          patientName: "Ramesh Kumar",
          status: "waiting",
          time: newApt.time,
          isUser: true,
          durationMinutes: 8
        }
      ].sort((a, b) => a.numericToken - b.numericToken);
    });

    return newApt;
  };

  // Demo tool: advance queue to next patient to see live UI react
  const advanceQueueNext = () => {
    setCurrentTokenNumber((prev) => {
      const nextToken = prev + 1;
      setQueueList((list) =>
        list.map((item) => {
          if (item.numericToken < nextToken) {
            return { ...item, status: "completed" };
          }
          if (item.numericToken === nextToken) {
            return { ...item, status: "in_progress" };
          }
          return { ...item, status: "waiting" };
        })
      );
      return nextToken;
    });
  };

  return (
    <QueueContext.Provider
      value={{
        activeAppointment,
        setActiveAppointment,
        queueList,
        setQueueList,
        currentTokenNumber,
        setCurrentTokenNumber,
        travelData,
        setTravelData,
        safetyBuffer,
        setSafetyBuffer,
        prediction,
        leaveAlert,
        bookAppointment,
        advanceQueueNext
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}
