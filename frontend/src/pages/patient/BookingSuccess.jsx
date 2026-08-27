import React from "react";
import { Link } from "react-router-dom";
import { Check, Activity, Calendar, ArrowRight, Sparkles, MapPin, Clock } from "lucide-react";
import Button from "../../components/common/Button";
import { useQueue } from "../../context/QueueContext";

export default function BookingSuccess() {
  const { activeAppointment, prediction } = useQueue();

  const doctor = activeAppointment?.doctor;
  const tokenNumber = activeAppointment?.tokenNumber || "TKN-103";
  const date = activeAppointment?.date || "16 May 2025";
  const time = activeAppointment?.time || "10:30 AM";
  const estimatedWait = prediction?.estimatedWaitMinutes ?? 15;

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-soft text-center space-y-6 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-heal-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Green Success Checkmark */}
        <div className="relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-heal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-heal-500/30 scale-100 transition-transform">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>

          <div className="mt-4 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Appointment Booked Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Your digital queue token has been generated.
            </p>
          </div>
        </div>

        {/* Appointment Details Grid matching reference Step 8 */}
        <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 text-left space-y-3.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-400">Doctor</span>
            <span className="font-extrabold text-slate-900">{doctor?.name || "Dr. Divyansh Pandey"}</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-400">Date & Time</span>
            <span className="font-bold text-slate-800">{date}, {time}</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-400">Clinic</span>
            <span className="font-bold text-slate-800">{doctor?.hospitalName || "City Care Hospital, Delhi"}</span>
          </div>

          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Token Number</span>
            <span className="text-xl sm:text-2xl font-black text-brand-700 bg-brand-100/60 px-3 py-0.5 rounded-xl">
              {tokenNumber}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-heal-700 bg-heal-50 px-3 py-2 rounded-xl border border-heal-200/60">
            <span className="font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-heal-600" />
              Est. Waiting Time
            </span>
            <span className="font-extrabold">{estimatedWait} min</span>
          </div>
        </div>

        {/* Action Buttons matching reference Step 8 */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/patient/appointments" className="flex-1">
            <Button variant="outline" size="md" fullWidth>
              View My Appointments
            </Button>
          </Link>

          <Link to="/patient/live-queue" className="flex-1">
            <Button variant="success" size="md" fullWidth icon={Activity} iconPosition="left">
              View Live Queue
            </Button>
          </Link>
        </div>

        <div>
          <Link
            to="/patient/dashboard"
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
