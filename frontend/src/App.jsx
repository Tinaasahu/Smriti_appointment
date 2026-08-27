import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { QueueProvider } from "./context/QueueContext";

// Layouts
import PatientLayout from "./layouts/PatientLayout";
import DoctorLayout from "./layouts/DoctorLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import PatientLogin from "./pages/patient/PatientLogin";
import OTPVerification from "./pages/patient/OTPVerification";
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import BookingSuccess from "./pages/patient/BookingSuccess";
import TokenView from "./pages/patient/TokenView";
import LiveQueue from "./pages/patient/LiveQueue";
import TravelPlanning from "./pages/patient/TravelPlanning";
import MyAppointments from "./pages/patient/MyAppointments";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

export default function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <BrowserRouter>
          <Routes>
            {/* Gateway & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/otp" element={<OTPVerification />} />

            {/* Authenticated Patient Experience */}
            <Route path="/patient" element={<PatientLayout />}>
              <Route index element={<Navigate to="/patient/dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="book" element={<BookAppointment />} />
              <Route path="booking-success" element={<BookingSuccess />} />
              <Route path="token" element={<TokenView />} />
              <Route path="live-queue" element={<LiveQueue />} />
              <Route path="travel" element={<TravelPlanning />} />
              <Route path="appointments" element={<MyAppointments />} />
            </Route>

            {/* Exclusive Doctor OPD Portal */}
            <Route path="/doctor" element={<DoctorLayout />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="queue" element={<DoctorDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}
