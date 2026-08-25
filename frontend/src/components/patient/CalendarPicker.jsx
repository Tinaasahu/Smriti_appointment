import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPicker({ selectedDate, onSelectDate }) {
  // May 2025 base date to match reference screenshot
  const [currentMonth, setCurrentMonth] = useState(4); // 0-indexed: 4 = May
  const [currentYear, setCurrentYear] = useState(2025);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  // Generate days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Day of week offset for the 1st day (0 = Mon, 6 = Sun)
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Mon is 0
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isSelected = (day) => {
    if (!selectedDate) return day === 16; // default 16 May
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
      {/* Month / Year Navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h4 className="text-sm font-bold text-slate-800">
          {months[currentMonth]} {currentYear}
        </h4>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-[11px] font-bold text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-9" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const selected = isSelected(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(new Date(currentYear, currentMonth, day))}
              className={`h-9 w-9 mx-auto rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                selected
                  ? "bg-brand-600 text-white font-bold shadow-md shadow-brand-500/30 scale-105"
                  : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
