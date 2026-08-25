import React from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  ShieldAlert, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import Button from "../common/Button";

export default function LeaveNowAlert({ 
  leaveAlert, 
  travelData, 
  appointment, 
  onGetDirections 
}) {
  const shouldLeaveNow = leaveAlert?.shouldLeaveNow ?? true;
  const urgency = leaveAlert?.urgency ?? "urgent";
  const travelMins = leaveAlert?.travelMinutes ?? 18;
  const estimatedWait = leaveAlert?.estimatedWaitMinutes ?? 15;
  const safetyBuffer = leaveAlert?.safetyBuffer ?? 10;
  const clinicAddress = travelData?.clinicLocation?.address || "City Care Hospital, Sector 14, New Delhi";
  const patientAddress = travelData?.patientLocation?.address || "Connaught Place, New Delhi";

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
        ? "bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/50 border-amber-300"
        : "bg-gradient-to-br from-heal-500/10 via-heal-50 to-emerald-50/50 border-heal-300"
    }`}>
      {/* Decorative ambient backdrop */}
      <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
        shouldLeaveNow ? "bg-amber-200/40" : "bg-heal-200/40"
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Status & Alert Text */}
        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/90 shadow-sm border border-slate-100">
            {shouldLeaveNow ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span className="text-amber-700">Departure Recommendation: Leave Now</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-heal-600" />
                <span className="text-heal-700">Departure Status: You're on Time</span>
              </>
            )}
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {shouldLeaveNow ? "⚠️ Time to head to the clinic!" : "🟢 You have plenty of time."}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Your estimated travel time is <strong className="text-slate-900">{travelMins} minutes</strong> (with {safetyBuffer} min safety buffer). 
              Your live queue position indicates you will be called in approximately <strong className="text-slate-900">{estimatedWait} minutes</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              Traffic: <strong>{travelData?.trafficLevel || "Medium"}</strong>
            </span>
            <span>•</span>
            <span>Recommended Route: <strong>Ring Road Expressway</strong></span>
          </div>
        </div>

        {/* Right CTA Button */}
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
