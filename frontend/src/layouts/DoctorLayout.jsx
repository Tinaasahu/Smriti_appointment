import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Stethoscope, User, ArrowRight, Shield, Activity, Sparkles } from "lucide-react";

export default function DoctorLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Doctor Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white font-black">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Smriti Doctor Portal
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Exclusive Queue Controller
              </span>
            </div>
            <p className="text-xs text-slate-400">Dr. Divyansh Pandey • Senior Cardiologist</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/patient/dashboard"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            <span>Open Patient View</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <User className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-semibold">OPD Room 402</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
