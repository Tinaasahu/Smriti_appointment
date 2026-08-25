import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Activity, Share2, Download, Printer } from "lucide-react";
import TokenCard from "../../components/patient/TokenCard";
import Button from "../../components/common/Button";
import { useQueue } from "../../context/QueueContext";

export default function TokenView() {
  const { activeAppointment, prediction } = useQueue();

  return (
    <div className="max-w-xl mx-auto space-y-6">
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
              Queue Token Details
            </h1>
            <p className="text-xs text-slate-500">
              Your official digital entry pass for doctor consultation.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          title="Print Token"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Main Token Card */}
      <TokenCard
        appointment={activeAppointment}
        prediction={prediction}
        showActions={true}
      />
    </div>
  );
}
