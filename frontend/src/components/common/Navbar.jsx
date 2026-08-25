import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bell, 
  MapPin, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Activity,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuToggle, isMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/patient/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left branding & Mobile Trigger */}
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/patient/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-heal-600 to-heal-400 flex items-center justify-center shadow-md shadow-heal-500/20 text-white font-bold transition-transform group-hover:scale-105">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Smriti</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">Patient</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 leading-none hidden sm:block">Smart Patient Insights</p>
          </div>
        </Link>
      </div>

      {/* Center Hospital Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
        <MapPin className="w-3.5 h-3.5 text-heal-600" />
        <span className="font-semibold text-slate-700">City Care Hospital</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">Sector 14, New Delhi</span>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Live Queue Direct Link */}
        <Link
          to="/patient/live-queue"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200/70 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Queue</span>
        </Link>

        {/* User profile dropdown pill */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("") : "RK"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || "Ramesh Kumar"}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{user?.phone || "+91 9876543210"}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
