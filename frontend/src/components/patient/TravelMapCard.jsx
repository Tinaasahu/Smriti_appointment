import React from "react";
import { 
  MapPin, 
  Navigation, 
  Car, 
  Clock, 
  Compass, 
  ExternalLink, 
  ShieldCheck,
  AlertTriangle 
} from "lucide-react";
import Badge from "../common/Badge";

export default function TravelMapCard({ travelData, appointment }) {
  const patientLoc = travelData?.patientLocation || { address: "Connaught Place, New Delhi" };
  const clinicLoc = travelData?.clinicLocation || { address: "City Care Hospital, Sector 14, New Delhi" };
  const distanceKm = travelData?.distanceKm ?? 4.8;
  const travelMinutes = travelData?.travelMinutes ?? 18;
  const trafficLevel = travelData?.trafficLevel || "Medium";

  const trafficColor = {
    Low: "text-heal-600 bg-heal-50 border-heal-200",
    Medium: "text-amber-600 bg-amber-50 border-amber-200",
    High: "text-rose-600 bg-rose-50 border-rose-200",
  }[trafficLevel] || "text-amber-600 bg-amber-50 border-amber-200";

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(patientLoc.address)}&destination=${encodeURIComponent(clinicLoc.address)}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-heal-50 text-heal-600 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Travel & Route Intelligence</h3>
            <p className="text-xs text-slate-400">Powered by Maps & Live Traffic API</p>
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
        >
          <span>Open in Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Interactive Map Visual Mockup */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50/50 p-6 flex flex-col justify-between overflow-hidden border-b border-slate-100">
        {/* Stylized Road Grid Background */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94A3B8" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          {/* Stylized Route Path */}
          <path
            d="M 60 140 C 140 100, 220 180, 320 80 S 480 90, 560 40"
            fill="none"
            stroke="#6C5CE7"
            strokeWidth="5"
            strokeDasharray="8 4"
            className="animate-pulse"
          />
        </svg>

        {/* Origin Marker */}
        <div className="relative z-10 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 text-xs font-bold text-slate-800 self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping" />
          <span className="truncate max-w-[180px]">You: {patientLoc.address}</span>
        </div>

        {/* Destination Marker */}
        <div className="relative z-10 inline-flex items-center gap-2 bg-heal-600 text-white px-3.5 py-1.5 rounded-2xl shadow-lg border border-heal-400 text-xs font-bold self-end">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{clinicLoc.address}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="p-6 grid grid-cols-3 gap-3 text-center bg-slate-50/50 border-b border-slate-100">
        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance</p>
          <p className="text-base sm:text-lg font-black text-slate-800 mt-0.5">{distanceKm} km</p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drive Time</p>
          <p className="text-base sm:text-lg font-black text-brand-600 mt-0.5">{travelMinutes} min</p>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Traffic</p>
          <div className="mt-0.5 inline-flex items-center gap-1 font-bold text-xs">
            <span className={`px-2 py-0.5 rounded-full border ${trafficColor}`}>
              {trafficLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Directions Steps */}
      <div className="p-6 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Turn-by-turn preview</h4>
        <div className="space-y-2">
          {travelData?.routeSteps?.map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-xs text-slate-600">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                {i + 1}
              </div>
              <div className="flex-1 flex justify-between">
                <span>{step.instruction}</span>
                <span className="text-slate-400 font-semibold">{step.distanceKm} km</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
