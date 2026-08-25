import React from "react";
import { Clock, Check } from "lucide-react";

export default function TimeSlotGrid({ slots, selectedSlot, onSelectSlot }) {
  const defaultSlots = [
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM"
  ];

  const slotList = slots && slots.length > 0 ? slots : defaultSlots;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Available Slots</span>
          </h4>
          <span className="text-[11px] font-semibold text-heal-700 bg-heal-50 px-2 py-0.5 rounded-full border border-heal-200">
            {slotList.length} Open
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {slotList.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20 scale-[1.02]"
                    : "bg-slate-50/70 hover:bg-brand-50/50 hover:border-brand-300 text-slate-700 border-slate-200/80"
                }`}
              >
                <span>{slot}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Standard slot: ~15 mins</span>
        <span className="text-brand-600 font-semibold">Priority token assigned</span>
      </div>
    </div>
  );
}
