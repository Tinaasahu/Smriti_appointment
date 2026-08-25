import React from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Clock, 
  Users, 
  Activity, 
  ArrowRight, 
  Calendar,
  CheckCircle,
  MapPin
} from "lucide-react";
import Badge from "../common/Badge";

export default function TokenCard({ appointment, prediction, showActions = true }) {
  if (!appointment) return null;

  const tokenNumber = appointment.tokenNumber || "TKN-103";
  const doctor = appointment.doctor;
  const status = appointment.status || "waiting";
  const patientsAhead = prediction?.patientsAhead ?? 2;
  const estimatedWait = prediction?.estimatedWaitMinutes ?? 15;
  const expectedTime = prediction?.estimatedAppointmentTime ?? appointment.time ?? "10:45 AM";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-brand-50/20 to-indigo-50/30 border-2 border-brand-200/80 p-6 sm:p-8 shadow-soft">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-brand-100/50 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Digital Queue Pass</span>
              <p className="text-[11px] text-slate-400">Smriti Smart Queue Verified</p>
            </div>
          </div>

          <Badge variant={status === "waiting" ? "waiting" : "in_progress"} size="lg">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
            <span className="uppercase">{status}</span>
          </Badge>
        </div>

        {/* Big Token Display */}
        <div className="text-center py-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-brand-100/70 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Your Queue Token
          </p>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-brand-700 to-indigo-600 bg-clip-text text-transparent">
            {tokenNumber}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {appointment.date} • Scheduled {appointment.time}
          </p>
        </div>

        {/* 3 Metric Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-center text-slate-400 mb-1">
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800">{patientsAhead}</p>
            <p className="text-[10px] font-semibold text-slate-400">Patients Ahead</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-center text-slate-400 mb-1">
              <Clock className="w-4 h-4 text-heal-600" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-heal-600">{estimatedWait} min</p>
            <p className="text-[10px] font-semibold text-slate-400">Est. Wait Time</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-center text-slate-400 mb-1">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800">{expectedTime}</p>
            <p className="text-[10px] font-semibold text-slate-400">Expected Turn</p>
          </div>
        </div>

        {/* Doctor & Clinic Info */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={doctor?.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100"}
              alt={doctor?.name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <p className="font-bold text-slate-800">{doctor?.name}</p>
              <p className="text-slate-500 font-medium">{doctor?.specialization}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{doctor?.hospitalName || "City Care Hospital, Delhi"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Optional Actions */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/patient/live-queue"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>View Live Queue</span>
            </Link>
            <Link
              to="/patient/travel"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4 text-heal-600" />
              <span>Travel & Leave Alert</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
