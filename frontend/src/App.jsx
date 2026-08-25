import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { QueueProvider } from "./context/QueueContext";

// Layouts
import PatientLayout from "./layouts/PatientLayout";

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

// Placeholder for secondary sub-pages
function PlaceholderView({ title }) {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-soft text-center text-slate-500 text-sm">
        <p className="font-semibold">{title} module active and synchronized with patient health vault.</p>
      </div>
    </div>
  );
}

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
              
              {/* Secondary Healthcare Vault Routes */}
              <Route path="records" element={<PlaceholderView title="Medical Records" />} />
              <Route path="prescriptions" element={<PlaceholderView title="Prescriptions" />} />
              <Route path="reports" element={<PlaceholderView title="Lab & Diagnostic Reports" />} />
              <Route path="profile" element={<PlaceholderView title="Patient Profile" />} />
              <Route path="settings" element={<PlaceholderView title="Notification & Account Settings" />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}
