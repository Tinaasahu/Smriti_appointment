import React from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Zap,
  MapPin,
  Car
} from "lucide-react";
import Button from "../common/Button";
import { useQueue } from "../../context/QueueContext";

export default function LeaveNowAlert({ 
  leaveAlert, 
  travelData, 
  onGetDirections 
}) {
  const { attendingSpeed, patientLocation } = useQueue();
  const shouldLeaveNow = leaveAlert?.shouldLeaveNow ?? true;
  const urgency = leaveAlert?.urgency ?? "urgent";
  const travelMins = leaveAlert?.travelMinutes ?? 18;
  const estimatedWait = leaveAlert?.estimatedWaitMinutes ?? 15;
  const safetyBuffer = leaveAlert?.safetyBuffer ?? 10;
  const distanceKm = leaveAlert?.distanceKm || travelData?.distanceKm || 4.8;
  const trafficLevel = leaveAlert?.trafficLevel || travelData?.trafficLevel || "Medium";
  const patientsAhead = leaveAlert?.patientsAhead ?? 2;

  const clinicAddress = travelData?.clinicLocation?.address || "Ojha Multispeciality Hospital, Anukool Chandra Banarjee Marg, near Parvati Hospital, Tagore Town, Prayagraj, UP 211002";
  const patientAddress = patientLocation?.address || travelData?.patientLocation?.address || "Connaught Place, New Delhi";

  const handleDirections = () => {
    if (onGetDirections) {
      onGetDirections();
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(patientAddress)}&destination=${encodeURIComponent(clinicAddress)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all shadow-soft relative overflow-hidden ${
      shouldLeaveNow
        ? "bg-gradient-to-br from-amber-500/15 via-amber-50 to-orange-100/60 border-amber-400"
        : urgency === "moderate"
        ? "bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 border-indigo-300"
        : "bg-gradient-to-br from-heal-500/10 via-heal-50 to-emerald-50/50 border-heal-300"
    }`}>
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-2xl pointer-events-none ${
        shouldLeaveNow ? "bg-amber-300/50" : "bg-heal-200/40"
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/90 shadow-sm border ${
              shouldLeaveNow ? "border-amber-300 text-amber-800" : "border-heal-300 text-heal-800"
            }`}>
              {shouldLeaveNow ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>SMART ALERT: LEAVE HOME NOW</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-heal-600" />
                  <span>DEPARTURE STATUS: ON TRACK</span>
                </>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-700 border border-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Doctor Attending Speed: {attendingSpeed} min/patient</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {shouldLeaveNow 
                ? "🚨 Doctor pace & traffic alert: Depart for the clinic immediately!" 
                : urgency === "moderate"
                ? "🟡 Prepare to leave soon. You have ~15 mins remaining."
                : "🟢 You have plenty of time. Relax at home."
              }
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
              Doctor is attending patients at <strong className="text-slate-900">{attendingSpeed} min/patient</strong>. With <strong className="text-slate-900">{patientsAhead} patient{patientsAhead === 1 ? "" : "s"} ahead</strong>, your call is expected in <strong className="text-slate-900">~{estimatedWait} mins</strong>. 
              Travel distance from your location (<strong className="text-slate-900">{patientAddress}</strong>) is <strong className="text-slate-900">{distanceKm} km</strong> ({travelMins} min travel + {safetyBuffer} min buffer).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 pt-1">
            <span className="flex items-center gap-1.5">
              <Car className="w-4 h-4 text-brand-600" />
              <span>Traffic Level: <strong>{trafficLevel}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-heal-600" />
              <span>Distance: <strong>{distanceKm} km</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Est. Travel: <strong>{travelMins} mins</strong></span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
          <Button
            variant={shouldLeaveNow ? "primary" : "success"}
            size="lg"
            icon={Navigation}
            iconPosition="left"
            onClick={handleDirections}
          >
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
