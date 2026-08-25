import React from "react";
import { Link } from "react-router-dom";
import { Activity, ShieldCheck, Lock, ArrowLeft, HeartPulse } from "lucide-react";

export default function AuthLayout({ children, title, subtitle, backTo = "/" }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Decorative & Info Section */}
        <div className="md:col-span-5 bg-gradient-to-br from-brand-50 via-indigo-50/70 to-heal-50/40 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-heal-200/40 blur-3xl" />

          {/* Logo & Headline */}
          <div className="relative z-10 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-heal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">Smriti</span>
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Smart Patient Insights</p>
              </div>
            </Link>

            <div className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
                Your secure timeline for holistic, end-to-end healthcare.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Experience real-time AI queue tracking, estimated wait times, and traffic-aware departure alerts.
              </p>
            </div>
          </div>

          {/* Healthcare Minimalist Graphic Representation */}
          <div className="relative z-10 my-6 flex items-center justify-center">
            <div className="w-full max-w-[240px] bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-heal-100 text-heal-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800">OTP-Secured Login</p>
                  <p className="text-[10px] text-slate-400">Aadhaar & Phone Linked</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-brand-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Zero Wait Anxiety</span>
                <span className="text-heal-600 font-semibold">Live ETA</span>
              </div>
            </div>
          </div>

          {/* Footer copyright */}
          <div className="relative z-10 text-[11px] text-slate-400">
            © 2026 Smriti. All rights reserved.
          </div>
        </div>

        {/* Right Form Card Section */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div className="flex justify-end">
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="my-auto max-w-sm w-full mx-auto py-6">
            {children}
          </div>

          <div className="text-center text-[11px] text-slate-400">
            By continuing you agree to our <a href="#" className="underline hover:text-slate-600">Terms & Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
