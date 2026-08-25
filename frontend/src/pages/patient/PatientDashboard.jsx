import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Activity, 
  MapPin, 
  FileText, 
  Pill, 
  FileCheck, 
  CalendarCheck, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  Plus
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import LeaveNowAlert from "../../components/patient/LeaveNowAlert";
import { useAuth } from "../../context/AuthContext";
import { useQueue } from "../../context/QueueContext";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { activeAppointment, prediction, leaveAlert, travelData, advanceQueueNext } = useQueue();
  const navigate = useNavigate();

  const userName = user?.name || "Ramesh Kumar";
  const doctor = activeAppointment?.doctor;
  const tokenNumber = activeAppointment?.tokenNumber || "TKN-103";
  const estimatedWait = prediction?.estimatedWaitMinutes ?? 15;
  const patientsAhead = prediction?.patientsAhead ?? 2;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dashboard Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Patient Dashboard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
              Live Queue Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{userName}</strong>. Your healthcare schedule is up to date.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/patient/book">
            <Button variant="primary" size="md" icon={Plus} iconPosition="left">
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards matching reference Screen 6 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Next Appointment"
          value={activeAppointment ? activeAppointment.time : "None"}
          subtitle={activeAppointment ? activeAppointment.date : "No upcoming schedule"}
          icon={Calendar}
        />

        <StatCard
          title="Token Number"
          value={tokenNumber}
          subtitle="Priority queue active"
          variant="purple"
          icon={Sparkles}
        />

        <StatCard
          title="Queue Status"
          value={activeAppointment?.status ? activeAppointment.status.toUpperCase() : "WAITING"}
          subtitle={`${patientsAhead} patient${patientsAhead === 1 ? "" : "s"} ahead`}
          variant="amber"
          icon={Activity}
        />

        <StatCard
          title="Est. Wait Time"
          value={`${estimatedWait} min`}
          subtitle="AI queue calculation"
          variant="green"
          icon={Clock}
        />
      </div>

      {/* Leave Now Alert Banner */}
      {leaveAlert && (
        <LeaveNowAlert
          leaveAlert={leaveAlert}
          travelData={travelData}
          appointment={activeAppointment}
          onGetDirections={() => navigate("/patient/travel")}
        />
      )}

      {/* Upcoming Appointment Card matching reference Step 6 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Upcoming Appointment</span>
            <span className="w-2 h-2 rounded-full bg-heal-500 animate-pulse" />
          </h2>
          <Link
            to="/patient/appointments"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeAppointment ? (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Doctor Avatar & Info */}
            <div className="flex items-start sm:items-center gap-4 flex-1">
              <img
                src={doctor?.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
                alt={doctor?.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">{doctor?.name}</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                    {doctor?.specialization}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeAppointment.date}, {activeAppointment.time}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doctor?.hospitalName || "City Care Hospital, Delhi"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Token Badge & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
              <div className="text-left md:text-right pr-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Your Token</div>
                <div className="text-xl font-black text-brand-700">{tokenNumber}</div>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/patient/token">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>

                <Link to="/patient/live-queue">
                  <Button variant="primary" size="sm" icon={Activity} iconPosition="left">
                    View Live Queue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-soft space-y-3">
            <p className="text-sm font-semibold text-slate-500">No active appointment found.</p>
            <Link to="/patient/book">
              <Button variant="primary" size="md">Book Your Next Appointment</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Health Summary 4 Quick Cards matching reference Step 6 */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Health Summary</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Records */}
          <Link
            to="/patient/records"
            className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Records</p>
              <p className="text-xl font-extrabold text-slate-900">{user?.stats?.records || 12}</p>
            </div>
          </Link>

          {/* Prescriptions */}
          <Link
            to="/patient/prescriptions"
            className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-md hover:border-amber-200 transition-all flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Prescriptions</p>
              <p className="text-xl font-extrabold text-slate-900">{user?.stats?.prescriptions || 5}</p>
            </div>
          </Link>

          {/* Reports */}
          <Link
            to="/patient/reports"
            className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-md hover:border-heal-200 transition-all flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-heal-50 text-heal-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Reports</p>
              <p className="text-xl font-extrabold text-slate-900">{user?.stats?.reports || 15}</p>
            </div>
          </Link>

          {/* Upcoming */}
          <Link
            to="/patient/appointments"
            className="group p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-md hover:border-brand-200 transition-all flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Upcoming</p>
              <p className="text-xl font-extrabold text-slate-900">{user?.stats?.upcoming || 2}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
