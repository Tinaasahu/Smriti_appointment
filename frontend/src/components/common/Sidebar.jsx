import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Calendar, 
  ListOrdered, 
  Navigation,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useQueue } from "../../context/QueueContext";

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const { activeAppointment, prediction } = useQueue();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/patient/dashboard", icon: LayoutDashboard },
    { name: "Book Appointment", path: "/patient/book", icon: CalendarPlus },
    { name: "My Appointments", path: "/patient/appointments", icon: Calendar },
    { 
      name: "Live Queue", 
      path: "/patient/live-queue", 
      icon: ListOrdered,
      badge: prediction?.status === "waiting" ? `${prediction.patientsAhead} Ahead` : "Live"
    },
    { name: "Travel & Route", path: "/patient/travel", icon: Navigation },
  ];

  const handleLogout = () => {
    logout();
    navigate("/patient/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-50 lg:z-20 h-screen lg:h-[calc(100vh-61px)] w-64 bg-white border-r border-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Navigation list */}
        <div className="py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Patient Portal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/25 font-semibold"
                      : "text-slate-600 hover:text-brand-700 hover:bg-brand-50/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600"}`} />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-heal-100 text-heal-700"}`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Queue Banner & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Active Token Preview Widget */}
          {activeAppointment && (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 border border-brand-100/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-brand-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-600" /> Active Token
                </span>
                <span className="font-extrabold text-brand-700">{activeAppointment.tokenNumber}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{activeAppointment.doctor?.name}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-medium text-sm transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
