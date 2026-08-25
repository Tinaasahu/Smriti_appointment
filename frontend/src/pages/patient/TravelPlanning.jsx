import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Navigation, Clock, MapPin, ShieldCheck, ExternalLink } from "lucide-react";
import LeaveNowAlert from "../../components/patient/LeaveNowAlert";
import TravelMapCard from "../../components/patient/TravelMapCard";
import Button from "../../components/common/Button";
import { useQueue } from "../../context/QueueContext";

export default function TravelPlanning() {
  const { activeAppointment, travelData, leaveAlert, prediction } = useQueue();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/patient/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Maps & Travel Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Traffic-aware navigation and intelligent Leave Now departure recommendations.
            </p>
          </div>
        </div>

        <Link to="/patient/live-queue">
          <Button variant="outline" size="sm">
            Back to Queue
          </Button>
        </Link>
      </div>

      {/* Leave Now Alert Banner */}
      {leaveAlert && (
        <LeaveNowAlert
          leaveAlert={leaveAlert}
          travelData={travelData}
          appointment={activeAppointment}
        />
      )}

      {/* Route & Map Card */}
      <TravelMapCard
        travelData={travelData}
        appointment={activeAppointment}
      />
    </div>
  );
}
