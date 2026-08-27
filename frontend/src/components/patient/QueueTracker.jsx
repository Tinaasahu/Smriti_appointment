import React from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Zap,
  Stethoscope
} from "lucide-react";
import Badge from "../common/Badge";
import { useQueue } from "../../context/QueueContext";

export default function QueueTracker({ 
  queueList, 
  userToken = "TKN-103", 
  prediction
}) {
  const { attendingSpeed } = useQueue();
  const patientsAhead = prediction?.patientsAhead ?? 2;
  const estimatedWait = prediction?.estimatedWaitMinutes ?? 15;
  const isUserTurn = patientsAhead === 0;

  return (
    <div className="space-y-6">
      {/* Dynamic Status Notification Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between flex-wrap gap-4 transition-all ${
        isUserTurn
          ? "bg-heal-50 border-heal-200 text-heal-900"
          : "bg-brand-50/70 border-brand-100 text-brand-900"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isUserTurn ? "bg-heal-600 text-white" : "bg-brand-600 text-white"
          }`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base leading-tight">
              {isUserTurn 
                ? "🎉 It's your turn! Please proceed to the consultation room." 
                : `You're getting closer. ${patientsAhead} patient${patientsAhead === 1 ? "" : "s"} ahead of you.`
              }
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Est. wait: <strong className="text-slate-800">{estimatedWait} mins</strong></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-amber-600" />
                <span>Attending Speed: {attendingSpeed} min/patient</span>
              </span>
            </p>
          </div>
        </div>

        {/* Link to Doctor Portal for testers */}
        <Link
          to="/doctor"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-sm transition-all flex-shrink-0"
        >
          <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
          <span>Doctor Portal (Queue Controller)</span>
        </Link>
      </div>

      {/* Queue Progress List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Queue Progress</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {queueList?.length || 0} Total Patients
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="hidden md:inline">Synced with Doctor Portal</span>
            <span className="w-2 h-2 rounded-full bg-heal-500 animate-ping" />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {queueList?.map((entry) => {
            const isYou = entry.isUser || entry.tokenNumber === userToken;
            const isCompleted = entry.status === "completed";
            const isInProgress = entry.status === "in_progress";
            const isWaiting = entry.status === "waiting";

            return (
              <div
                key={entry.id}
                className={`px-6 py-4 flex items-center justify-between transition-colors ${
                  isYou
                    ? "bg-brand-50/60 font-bold border-l-4 border-l-brand-600"
                    : isInProgress
                    ? "bg-amber-50/30"
                    : "hover:bg-slate-50/60"
                }`}
              >
                {/* Left Token & Patient Name */}
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-xl font-extrabold text-xs tracking-wide ${
                    isYou
                      ? "bg-brand-600 text-white shadow-sm"
                      : isInProgress
                      ? "bg-amber-500 text-white"
                      : isCompleted
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {entry.tokenNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isYou ? "text-brand-900 font-extrabold" : "text-slate-800 font-semibold"}`}>
                        {entry.patientName}
                      </span>
                      {isYou && (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-brand-200/70 text-brand-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-normal">
                      Slot: {entry.time} • Est. Pace: ~{attendingSpeed} min
                    </p>
                  </div>
                </div>

                {/* Right Status Badge */}
                <div>
                  {isCompleted && (
                    <Badge variant="completed" size="md">
                      <CheckCircle2 className="w-3 h-3 text-heal-600" />
                      <span>Completed</span>
                    </Badge>
                  )}
                  {isInProgress && (
                    <Badge variant="in_progress" size="md">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      <span>In Consultation</span>
                    </Badge>
                  )}
                  {isWaiting && !isYou && (
                    <Badge variant="waiting" size="md">
                      <span>Waiting</span>
                    </Badge>
                  )}
                  {isWaiting && isYou && (
                    <Badge variant="purple" size="md" className="border-brand-300">
                      <span>Waiting (Your Turn)</span>
                    </Badge>
                  )}
                  {entry.status === "upcoming" && (
                    <Badge variant="upcoming" size="md">
                      <span>Upcoming</span>
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
