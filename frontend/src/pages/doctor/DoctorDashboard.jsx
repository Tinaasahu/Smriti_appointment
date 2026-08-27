import React, { useState } from "react";
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  Users, 
  Zap, 
  UserCheck, 
  AlertCircle, 
  Volume2, 
  Sparkles,
  ArrowRight,
  Stethoscope,
  Activity,
  ShieldCheck
} from "lucide-react";
import { useQueue } from "../../context/QueueContext";
import Badge from "../../components/common/Badge";

export default function DoctorDashboard() {
  const { 
    currentTokenNumber, 
    queueList, 
    attendingSpeed, 
    setAttendingSpeed, 
    currentServingPatient, 
    doctorCallNextPatient, 
    doctorStartConsultation, 
    doctorCompleteConsultation 
  } = useQueue();

  const [customSpeed, setCustomSpeed] = useState(attendingSpeed);
  const [notificationMsg, setNotificationMsg] = useState("");

  const handleCallNext = () => {
    doctorCallNextPatient();
    const nextToken = currentTokenNumber + 1;
    setNotificationMsg(`📢 Called Patient Token TKN-${nextToken} to OPD Room 402!`);
    setTimeout(() => setNotificationMsg(""), 5000);
  };

  const handlePaceChange = (speed) => {
    setAttendingSpeed(speed);
    setCustomSpeed(speed);
    setNotificationMsg(`⚡ Attending pace updated to ${speed} min / patient.`);
    setTimeout(() => setNotificationMsg(""), 4000);
  };

  const currentPatient = queueList.find(p => p.numericToken === currentTokenNumber) || currentServingPatient;
  const waitingPatients = queueList.filter(p => p.numericToken > currentTokenNumber);
  const completedPatients = queueList.filter(p => p.numericToken < currentTokenNumber);

  return (
    <div className="space-y-8">
      {/* Top Banner Alert when Action performed */}
      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-brand-600/90 text-white font-extrabold text-sm flex items-center justify-between shadow-lg animate-pulse border border-brand-400">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5" />
            <span>{notificationMsg}</span>
          </div>
          <span className="text-xs font-normal opacity-80">Broadcasted to Patient Live Queue</span>
        </div>
      )}

      {/* Main Doctor Control Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Live OPD Queue Controller
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            As the attending doctor, your queue actions dictate real-time patient predictions & departure notifications.
          </p>
        </div>

        {/* Big Move Next Action Button */}
        <button
          onClick={handleCallNext}
          className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-xl shadow-brand-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>Move Next (Call Patient TKN-{currentTokenNumber + 1})</span>
        </button>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Currently Serving Patient Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-brand-500/50 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400 animate-pulse" />
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                Currently Attending Patient
              </span>
            </div>
            <Badge variant="in_progress" size="lg">
              IN CONSULTATION
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {currentPatient?.tokenNumber || `TKN-${currentTokenNumber}`}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-200 mt-1">
                {currentPatient?.patientName || "Rahul Verma"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Session Started: <strong>{currentServingPatient?.startedAt || "10:30 AM"}</strong></span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => doctorStartConsultation(currentPatient?.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-brand-400" />
                <span>Start Vitals</span>
              </button>

              <button
                onClick={() => doctorCompleteConsultation(currentPatient?.id)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Attending Speed Control Widget */}
        <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-700/70 pb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Attending Speed Control</h3>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Doctor Attending Pace:</span>
              <span className="text-2xl font-black text-amber-400">{attendingSpeed} min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Adjusting this value instantly updates all patients' wait time predictions.
            </p>
          </div>

          {/* Quick Pace Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePaceChange(5.0)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                attendingSpeed === 5.0 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500" 
                  : "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              🚀 Fast (5m)
            </button>

            <button
              onClick={() => handlePaceChange(8.0)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                attendingSpeed === 8.0 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500" 
                  : "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              ⚡ Std (8m)
            </button>

            <button
              onClick={() => handlePaceChange(12.0)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                attendingSpeed === 12.0 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500" 
                  : "bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              🔍 Slow (12m)
            </button>
          </div>
        </div>
      </div>

      {/* Full Patient Queue List */}
      <div className="bg-slate-800/90 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden space-y-4">
        <div className="px-6 py-5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-brand-400" />
            <h3 className="font-extrabold text-white text-base sm:text-lg">Today's Patient Queue List</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
            <span>{waitingPatients.length} Waiting</span>
            <span>•</span>
            <span>{completedPatients.length} Completed</span>
          </div>
        </div>

        <div className="divide-y divide-slate-700/60">
          {queueList.map((entry) => {
            const isCurrent = entry.numericToken === currentTokenNumber;
            const isCompleted = entry.numericToken < currentTokenNumber;
            const isWaiting = entry.numericToken > currentTokenNumber;

            return (
              <div 
                key={entry.id}
                className={`px-6 py-4 flex items-center justify-between transition-colors ${
                  isCurrent ? "bg-brand-950/40 border-l-4 border-l-brand-500" : "hover:bg-slate-700/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-xl font-extrabold text-xs tracking-wide ${
                    isCurrent 
                      ? "bg-brand-600 text-white" 
                      : isCompleted 
                      ? "bg-slate-700 text-slate-400" 
                      : "bg-slate-900 text-slate-200"
                  }`}>
                    {entry.tokenNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200">{entry.patientName}</span>
                      {entry.isUser && (
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          Target Patient (Tina)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scheduled Slot: {entry.time} • Est Duration: {attendingSpeed} min
                    </p>
                  </div>
                </div>

                <div>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Completed
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/30">
                      <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                      Attending Now
                    </span>
                  )}
                  {isWaiting && (
                    <span className="text-xs font-semibold text-slate-400">
                      Waiting (Est. wait {(entry.numericToken - currentTokenNumber - 1) * attendingSpeed} min)
                    </span>
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
