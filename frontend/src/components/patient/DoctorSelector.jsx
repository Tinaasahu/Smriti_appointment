import React from "react";
import { Stethoscope, Star, Clock, MapPin, ChevronDown, Check } from "lucide-react";
import { MOCK_DOCTORS } from "../../data/mockData";

export default function DoctorSelector({ selectedDoctor, onSelectDoctor }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        Select Doctor
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MOCK_DOCTORS.map((doc) => {
          const isSelected = selectedDoctor?.id === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoctor(doc)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "border-brand-600 bg-brand-50/40 shadow-md shadow-brand-500/10 ring-2 ring-brand-500/20"
                  : "border-slate-200/80 bg-white hover:border-brand-300 hover:bg-slate-50/50"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-0.5 pr-4">
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{doc.name}</h4>
                  <p className="text-xs font-semibold text-brand-700">{doc.specialization}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{doc.hospitalName}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{doc.rating}</span>
                  <span className="text-slate-400 font-normal">({doc.reviewsCount})</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>~{doc.averageConsultationMinutes} min/patient</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
