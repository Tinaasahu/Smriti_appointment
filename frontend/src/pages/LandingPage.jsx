import React from "react";
import { Link } from "react-router-dom";
import { 
  Activity, 
  User, 
  Stethoscope, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  CheckCircle2 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-brand-100 selection:text-brand-700">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-heal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">Smriti</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">2.0</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400">Smart Patient Insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            AI-Powered Healthcare
          </span>
          <button className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">
            About & Team
          </button>
        </div>
      </header>

      {/* Main Hero & Portal Gateway */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        {/* Left Hero Content */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-heal-50 border border-heal-200 text-heal-700 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-heal-600" />
            Smart Digital Waiting Queue
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Healthcare intelligence, <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-heal-500 bg-clip-text text-transparent">reimagined.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            AI-powered patient history, intelligent live queue tracking, consultation wait-time predictions, and traffic-aware departure recommendation system.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-heal-600 flex-shrink-0" />
              <span>AI diagnostic suggestions</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-heal-600 flex-shrink-0" />
              <span>End-to-end encrypted records</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-heal-600 flex-shrink-0" />
              <span>Aadhaar-linked patient identity</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-heal-600 flex-shrink-0" />
              <span>OTP-based secure login</span>
            </div>
          </div>
        </div>

        {/* Right Portal Cards */}
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Choose your portal</p>

          {/* Doctor Portal Card */}
          <div className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-xl hover:border-heal-200 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-heal-50 text-heal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Doctor Portal</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-heal-100 text-heal-800">Clinical Suite</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Access patient records, AI diagnostics, live queue control, and complete treatment workflow.
                </p>
                <div className="pt-3">
                  <Link
                    to="/patient/dashboard" // Route preview
                    className="inline-flex items-center gap-2 text-xs font-bold text-heal-700 group-hover:text-heal-800"
                  >
                    <span>Login as Doctor</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Portal Card (PRIMARY FOCUS) */}
          <div className="group bg-gradient-to-br from-white to-brand-50/40 rounded-3xl p-6 sm:p-7 border-2 border-brand-200/80 shadow-soft hover:shadow-xl hover:border-brand-500 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-24 h-24 bg-brand-100/50 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Patient Portal</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 animate-pulse-subtle">
                    Live Queue Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View your digital token, real-time wait times, book doctor appointments, and get Leave Now traffic alerts.
                </p>
                <div className="pt-3">
                  <Link
                    to="/patient/login"
                    className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all"
                  >
                    <span>Login as Patient</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        © 2026 Smriti — Smart Digital Waiting Queue. Team Asclepius.
      </footer>
    </div>
  );
}
