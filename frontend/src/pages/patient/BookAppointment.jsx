import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Stethoscope, Sparkles, CheckCircle2 } from "lucide-react";
import DoctorSelector from "../../components/patient/DoctorSelector";
import CalendarPicker from "../../components/patient/CalendarPicker";
import TimeSlotGrid from "../../components/patient/TimeSlotGrid";
import Button from "../../components/common/Button";
import { MOCK_DOCTORS } from "../../data/mockData";
import { useQueue } from "../../context/QueueContext";

export default function BookAppointment() {
  const [selectedDoctor, setSelectedDoctor] = useState(MOCK_DOCTORS[0]);
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 4, 16)); // 16 May 2025
  const [selectedSlot, setSelectedSlot] = useState("10:30 AM");
  const [loading, setLoading] = useState(false);

  const { bookAppointment } = useQueue();
  const navigate = useNavigate();

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setLoading(true);

    const formattedDate = selectedDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    setTimeout(() => {
      const newApt = bookAppointment({
        doctor: selectedDoctor,
        date: formattedDate,
        time: selectedSlot
      });
      setLoading(false);
      navigate("/patient/booking-success");
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button & Header */}
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
              Book Appointment
            </h1>
            <p className="text-xs text-slate-500">
              Select your preferred doctor, date, and consultation time slot.
            </p>
          </div>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Instant Token Generation
        </div>
      </div>

      <form onSubmit={handleConfirmBooking} className="space-y-6">
        {/* 1. Doctor Selection */}
        <DoctorSelector
          selectedDoctor={selectedDoctor}
          onSelectDoctor={setSelectedDoctor}
        />

        {/* 2. Date & Time Selection (Side by Side matching reference Step 7) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Date
            </label>
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Time Slot
            </label>
            <TimeSlotGrid
              slots={selectedDoctor?.slots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          </div>
        </div>

        {/* 3. Booking Summary Card */}
        <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Selected Schedule</p>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              {selectedDoctor.name} ({selectedDoctor.specialization})
            </h4>
            <p className="text-xs text-slate-500">
              {selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} • {selectedSlot} • {selectedDoctor.hospitalName}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-slate-400">Consultation Fee</p>
            <p className="text-base font-black text-slate-900">{selectedDoctor.consultationFee}</p>
          </div>
        </div>

        {/* Full-width Confirm Appointment CTA matching reference Step 7 */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={CheckCircle2}
          iconPosition="right"
          className="py-4 text-base rounded-2xl shadow-lg shadow-brand-500/25"
        >
          Confirm Appointment
        </Button>
      </form>
    </div>
  );
}
