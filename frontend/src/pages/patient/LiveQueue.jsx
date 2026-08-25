import React from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  Sparkles, 
  Navigation, 
  Brain, 
  ShieldCheck,
  RefreshCw,
  Play
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import QueueTracker from "../../components/patient/QueueTracker";
import Button from "../../components/common/Button";
import { useQueue } from "../../context/QueueContext";

export default function LiveQueue() {
  const { 
    activeAppointment, 
    queueList, 
    prediction, 
    advanceQueueNext,
    currentTokenNumber 
  } = useQueue();

  const tokenNumber = activeAppointment?.tokenNumber || "TKN-103";
  const estimatedWait = prediction?.estimatedWaitMinutes ?? 15;
  const status = activeAppointment?.status || "waiting";
  const confidence = prediction?.confidence || "medium";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Button matching reference Step 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/patient/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Live Queue Status
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time patient order, estimated wait time, and room calling notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/patient/travel">
            <Button variant="outline" size="sm" icon={Navigation} iconPosition="left">
              Travel & Leave Time
            </Button>
          </Link>

          <button
            onClick={advanceQueueNext}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Call Next (Simulate)</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards matching reference Step 9 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Your Token"
          value={tokenNumber}
          subtitle="Priority pass"
          variant="purple"
          icon={Sparkles}
        />

        <StatCard
          title="Status"
          value={status.toUpperCase()}
          subtitle={`Serving TKN-${currentTokenNumber}`}
          variant="amber"
          icon={Activity}
        />

        <StatCard
          title="Estimated Wait Time"
          value={`${estimatedWait} min`}
          subtitle={`Expected: ${prediction?.estimatedAppointmentTime || "10:45 AM"}`}
          variant="green"
          icon={Clock}
        />
      </div>

      {/* Real-time Queue Progress Table */}
      <QueueTracker
        queueList={queueList}
        userToken={tokenNumber}
        prediction={prediction}
        onAdvanceDemo={advanceQueueNext}
      />

      {/* AI Prediction & Confidence Insights Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">AI Wait-Time Intelligence</h3>
              <p className="text-xs text-slate-400">Rule-based dynamic engine (prediction/estimator.py)</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
            confidence === "high" ? "bg-heal-100 text-heal-800" : "bg-blue-100 text-blue-800"
          }`}>
            {confidence} Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-medium">Doctor Avg Speed</span>
            <p className="font-extrabold text-slate-800 mt-0.5">
              ~{activeAppointment?.doctor?.averageConsultationMinutes || 8} min / consultation
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-medium">Accumulated Delay Buffer</span>
            <p className="font-extrabold text-slate-800 mt-0.5">+2.0 min doctor delay</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-medium">Sample History</span>
            <p className="font-extrabold text-slate-800 mt-0.5">22 completed today</p>
          </div>
        </div>
      </div>
    </div>
  );
}
