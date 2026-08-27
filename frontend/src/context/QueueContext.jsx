import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { INITIAL_ACTIVE_APPOINTMENT, INITIAL_QUEUE_DATA, MOCK_DOCTORS, MOCK_TRAVEL_INFO } from "../data/mockData";
import { predictionService } from "../services/predictionService";
import { mapsService } from "../services/mapsService";
import { queueService } from "../services/queueService";
import { appointmentService } from "../services/appointmentService";

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [activeAppointment, setActiveAppointment] = useState(() => {
    const saved = localStorage.getItem("smriti_active_appointment");
    return saved ? JSON.parse(saved) : INITIAL_ACTIVE_APPOINTMENT;
  });

  const [queueList, setQueueList] = useState(INITIAL_QUEUE_DATA);
  const [currentTokenNumber, setCurrentTokenNumber] = useState(102); // 102 is currently serving
  const [attendingSpeed, setAttendingSpeed] = useState(5.0); // Default 5.0 minutes per patient
  const [moveNextHistory, setMoveNextHistory] = useState([]); // Timestamps of doctor Move Next clicks
  const [travelData, setTravelData] = useState(MOCK_TRAVEL_INFO);
  const [safetyBuffer, setSafetyBuffer] = useState(10); // 10 minutes safety buffer
  const [backendOrchestration, setBackendOrchestration] = useState(null);
  const [patientLocation, setPatientLocation] = useState(MOCK_TRAVEL_INFO.patientLocation);
  const [currentServingPatient, setCurrentServingPatient] = useState({
    tokenNumber: "TKN-102",
    numericToken: 102,
    patientName: "Sita Verma",
    startedAt: new Date(Date.now() - 2 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Cross-Tab Broadcast Channel & LocalStorage Sync
  const channelRef = useRef(null);

  useEffect(() => {
    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel("smriti_queue_channel");
      channelRef.current.onmessage = (event) => {
        if (event.data?.type === "QUEUE_STATE_SYNC") {
          const { currentToken, speed, queue, history, serving } = event.data;
          if (currentToken) setCurrentTokenNumber(currentToken);
          if (speed) setAttendingSpeed(speed);
          if (queue) setQueueList(queue);
          if (history) setMoveNextHistory(history);
          if (serving) setCurrentServingPatient(serving);
        }
      };
    }

    const handleStorageChange = (e) => {
      if (e.key === "smriti_live_queue_sync" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.currentToken) setCurrentTokenNumber(data.currentToken);
          if (data.speed) setAttendingSpeed(data.speed);
          if (data.queue) setQueueList(data.queue);
          if (data.serving) setCurrentServingPatient(data.serving);
        } catch (err) {
          // ignore parse error
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channelRef.current) channelRef.current.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Helper to broadcast state to all open tabs
  const broadcastState = (newState) => {
    const payload = {
      type: "QUEUE_STATE_SYNC",
      currentToken: newState.currentToken || currentTokenNumber,
      speed: newState.speed || attendingSpeed,
      queue: newState.queue || queueList,
      history: newState.history || moveNextHistory,
      serving: newState.serving || currentServingPatient
    };

    if (channelRef.current) {
      channelRef.current.postMessage(payload);
    }
    localStorage.setItem("smriti_live_queue_sync", JSON.stringify(payload));
  };

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Save active appointment changes to localStorage
  useEffect(() => {
    if (activeAppointment) {
      localStorage.setItem("smriti_active_appointment", JSON.stringify(activeAppointment));
    }
  }, [activeAppointment]);

  // Fetch Live Orchestration Data from Backend GET /patient/dashboard/{token} (Poll every 3s for fast sync)
  useEffect(() => {
    if (!activeAppointment?.tokenNumber) return;

    let isMounted = true;
    const fetchOrchestration = async () => {
      try {
        const token = activeAppointment.tokenNumber;
        const res = await queueService.getPatientDashboardOrchestration(
          token,
          patientLocation.lat || 28.6139,
          patientLocation.lng || 77.2090,
          28.5355,
          77.3910,
          safetyBuffer
        );
        if (res && res.success && isMounted) {
          setBackendOrchestration(res);
          if (res.queue?.current_token) {
            setCurrentTokenNumber(res.queue.current_token);
          }
          if (res.maps) {
            setTravelData(prev => ({
              ...prev,
              distanceKm: res.maps.distance_km,
              travelMinutes: res.maps.travel_minutes,
              trafficLevel: res.maps.traffic_level,
              leaveHomeAt: res.maps.leave_home_at
            }));
          }
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchOrchestration();
    const interval = setInterval(fetchOrchestration, 3000); // refresh every 3s for live cross-tab sync
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeAppointment?.tokenNumber, patientLocation, safetyBuffer]);

  // Derive Prediction Output taking live move-next attending speed into account
  const prediction = useMemo(() => {
    if (!activeAppointment) return null;
    const patientTokenNum = activeAppointment.numericToken || 105; // Tina Sahu is Token 105 (second last in 101-106 queue)

    const effectiveAttendingSpeed = attendingSpeed || 5.0;

    return predictionService.calculatePrediction({
      currentToken: currentTokenNumber,
      patientToken: patientTokenNum,
      averageConsultationTime: effectiveAttendingSpeed,
      doctorDelay: 0.0,
      consultationCount: moveNextHistory.length || 20
    });
  }, [activeAppointment, currentTokenNumber, attendingSpeed, moveNextHistory]);

  // Derive Leave Alert evaluation based on attending speed, distance, location & traffic
  const leaveAlert = useMemo(() => {
    if (!prediction) return null;
    const travelMins = travelData.travelMinutes || 18;
    const estWait = prediction.estimatedWaitMinutes;

    const totalTravelRequired = travelMins + safetyBuffer;
    const shouldLeaveNow = totalTravelRequired >= estWait || prediction.patientsAhead <= 2;
    const urgency = shouldLeaveNow ? "urgent" : (estWait - totalTravelRequired <= 15 ? "moderate" : "normal");

    return {
      shouldLeaveNow,
      urgency,
      estimatedWaitMinutes: estWait,
      travelMinutes: travelMins,
      safetyBuffer,
      patientsAhead: prediction.patientsAhead,
      attendingSpeed,
      distanceKm: travelData.distanceKm || 4.8,
      trafficLevel: travelData.trafficLevel || "Medium",
      leaveHomeAt: travelData.leaveHomeAt || "10:02 AM"
    };
  }, [prediction, travelData, safetyBuffer, attendingSpeed]);

  // Trigger Notification if shouldLeaveNow becomes true
  useEffect(() => {
    if (leaveAlert?.shouldLeaveNow && "Notification" in window && Notification.permission === "granted") {
      new Notification("⚠️ Smriti Queue Alert: Time to Leave!", {
        body: `Estimated travel is ${leaveAlert.travelMinutes} mins with traffic. Doctor is attending at ${attendingSpeed} min/patient. Head to clinic now!`,
        icon: "/favicon.ico"
      });
    }
  }, [leaveAlert?.shouldLeaveNow, attendingSpeed, leaveAlert?.travelMinutes]);

  // HTML5 Browser Geolocation support
  const useCurrentGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          address: "Your Current Live GPS Location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setPatientLocation(coords);
        // Recalculate distance dynamically
        setTravelData(prev => ({
          ...prev,
          patientLocation: coords,
          distanceKm: 3.5 + Math.round(Math.random() * 20) / 10,
          travelMinutes: 14 + Math.round(Math.random() * 8)
        }));
      },
      (err) => {
        console.warn("Geolocation permission denied/failed:", err.message);
      }
    );
  };

  // DOCTOR PORTAL METHOD: Call Next Patient (Move Next)
  // Calculates live average consultation time based on Move Next click intervals, otherwise 5 mins
  const doctorCallNextPatient = async () => {
    const now = Date.now();
    const newHistory = [...moveNextHistory, now];
    setMoveNextHistory(newHistory);

    let newSpeed = attendingSpeed;

    // Calculate actual average interval in minutes between Move Next clicks
    if (newHistory.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newHistory.length; i++) {
        const diffMins = (newHistory[i] - newHistory[i - 1]) / 60000;
        if (diffMins > 0.02 && diffMins < 60) {
          intervals.push(diffMins);
        }
      }
      if (intervals.length > 0) {
        newSpeed = Math.max(1.0, Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10);
        setAttendingSpeed(newSpeed);
      }
    } else {
      newSpeed = 5.0;
      setAttendingSpeed(5.0);
    }

    const nextToken = currentTokenNumber + 1;
    setCurrentTokenNumber(nextToken);

    // Find patient in queue
    const nextPatient = queueList.find(p => p.numericToken === nextToken);
    let servingObj = null;
    if (nextPatient) {
      servingObj = {
        tokenNumber: nextPatient.tokenNumber,
        numericToken: nextPatient.numericToken,
        patientName: nextPatient.patientName,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      servingObj = {
        tokenNumber: `TKN-${nextToken}`,
        numericToken: nextToken,
        patientName: `Patient #${nextToken}`,
        startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    setCurrentServingPatient(servingObj);

    const updatedList = queueList.map((item) => {
      if (item.numericToken < nextToken) {
        return { ...item, status: "completed" };
      }
      if (item.numericToken === nextToken) {
        return { ...item, status: "in_progress" };
      }
      return { ...item, status: "waiting" };
    });

    setQueueList(updatedList);

    // Broadcast state immediately to all open patient tabs & windows
    broadcastState({
      currentToken: nextToken,
      speed: newSpeed,
      queue: updatedList,
      history: newHistory,
      serving: servingObj
    });

    // Call Backend RPC if available
    try {
      const docId = activeAppointment?.doctor?.id || "00000000-0000-0000-0000-000000000001";
      const todayStr = new Date().toISOString().split("T")[0];
      await queueService.doctorCallNext(docId, todayStr);
    } catch (e) {
      console.warn("[QueueContext] Backend call-next RPC notice:", e.message);
    }
  };

  // DOCTOR PORTAL METHOD: Start Consultation
  const doctorStartConsultation = async (appointmentId) => {
    const updatedList = queueList.map(item => item.numericToken === currentTokenNumber ? { ...item, status: "in_progress" } : item);
    setQueueList(updatedList);
    broadcastState({ queue: updatedList });

    try {
      await queueService.startConsultation(appointmentId || activeAppointment?.id);
    } catch (e) {
      console.warn("Backend start consultation fallback:", e.message);
    }
  };

  // DOCTOR PORTAL METHOD: Complete Consultation
  const doctorCompleteConsultation = async (appointmentId) => {
    doctorCallNextPatient();
    try {
      await queueService.completeConsultation(appointmentId || activeAppointment?.id);
    } catch (e) {
      console.warn("Backend complete consultation fallback:", e.message);
    }
  };

  // Booking a new appointment
  const bookAppointment = async ({ doctor, date, time, hospital }) => {
    const selectedDoctor = doctor || MOCK_DOCTORS[0];
    const selectedHospital = hospital || activeAppointment?.hospital || { name: "City Care Hospital" };

    let createdData = null;
    try {
      createdData = await appointmentService.createAppointment({
        doctorId: selectedDoctor.id || "00000000-0000-0000-0000-000000000001",
        hospitalId: selectedHospital.id || "00000000-0000-0000-0000-000000000001",
        departmentId: "00000000-0000-0000-0000-000000000001",
        patientId: "00000000-0000-0000-0000-000000000001",
        appointmentDate: typeof date === "string" ? date : new Date().toISOString().split("T")[0],
        scheduledStartTime: time || "10:30 AM"
      });
    } catch (e) {
      console.warn("[QueueContext] API Appointment creation fallback:", e.message);
    }

    const tokenNum = createdData?.numeric_token || (100 + Math.floor(Math.random() * 20) + 1);
    const tokenStr = createdData?.token_number || `TKN-${tokenNum}`;

    const newApt = {
      id: createdData?.id || `apt-${Date.now()}`,
      tokenNumber: tokenStr,
      numericToken: tokenNum,
      doctor: selectedDoctor,
      hospital: selectedHospital,
      date: date || "Today",
      rawDate: new Date().toISOString().split("T")[0],
      time: time || "10:30 AM",
      status: "waiting",
      priority: "normal",
      createdAt: new Date().toISOString(),
      patientLocation: patientLocation
    };

    setActiveAppointment(newApt);

    setQueueList((prev) => {
      const exists = prev.some(item => item.tokenNumber === newApt.tokenNumber);
      if (exists) return prev;
      const updated = [
        ...prev,
        {
          id: `q-${tokenNum}`,
          tokenNumber: newApt.tokenNumber,
          numericToken: tokenNum,
          patientName: "Tina Sahu",
          status: "waiting",
          time: newApt.time,
          isUser: true,
          durationMinutes: attendingSpeed
        }
      ].sort((a, b) => a.numericToken - b.numericToken);

      broadcastState({ queue: updated });
      return updated;
    });

    return newApt;
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
        attendingSpeed,
        setAttendingSpeed,
        moveNextHistory,
        travelData,
        setTravelData,
        safetyBuffer,
        setSafetyBuffer,
        prediction,
        leaveAlert,
        backendOrchestration,
        patientLocation,
        setPatientLocation,
        currentServingPatient,
        useCurrentGeolocation,
        bookAppointment,
        doctorCallNextPatient,
        doctorStartConsultation,
        doctorCompleteConsultation
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
