import React from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Activity,
  Sparkles
} from "lucide-react";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import { useQueue } from "../../context/QueueContext";
import { MOCK_PAST_APPOINTMENTS } from "../../data/mockData";

export default function MyAppointments() {
  const { activeAppointment } = useQueue();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active live queue sessions and view past consultation history.
          </p>
        </div>

        <Link to="/patient/book">
          <Button variant="primary" size="md" icon={Plus} iconPosition="left">
            Book New
          </Button>
        </Link>
      </div>

      {/* Active Scheduled Appointment */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span>Active & Upcoming</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </h2>

        {activeAppointment ? (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-brand-200/80 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={activeAppointment.doctor?.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
                alt={activeAppointment.doctor?.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">{activeAppointment.doctor?.name}</h3>
                  <Badge variant="purple" size="sm">{activeAppointment.doctor?.specialization}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeAppointment.date} • {activeAppointment.time}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeAppointment.doctor?.hospitalName || "City Care Hospital, Delhi"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
              <div className="text-left md:text-right pr-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Token</div>
                <div className="text-xl font-black text-brand-700">{activeAppointment.tokenNumber}</div>
              </div>

              <Link to="/patient/live-queue">
                <Button variant="primary" size="sm" icon={Activity} iconPosition="left">
                  Live Queue
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No active appointment.</p>
        )}
      </div>

      {/* Past Completed Appointments */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900">Past Consultations</h2>

        <div className="space-y-3">
          {MOCK_PAST_APPOINTMENTS.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{apt.doctorName}</h4>
                  <span className="text-xs text-slate-500">({apt.specialization})</span>
                  <Badge variant="completed" size="sm">Completed</Badge>
                </div>
                <p className="text-xs text-slate-500">{apt.diagnosis}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{apt.date} at {apt.time}</span>
                  <span>•</span>
                  <span>Token: {apt.tokenNumber}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  {apt.prescriptionCount} Prescriptions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
