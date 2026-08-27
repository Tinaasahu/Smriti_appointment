import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Navigation, Clock, MapPin, ShieldCheck, Crosshair, Zap, Search, Loader2 } from "lucide-react";
import LeaveNowAlert from "../../components/patient/LeaveNowAlert";
import TravelMapCard from "../../components/patient/TravelMapCard";
import Button from "../../components/common/Button";
import { useQueue } from "../../context/QueueContext";
import { mapsService } from "../../services/mapsService";

export default function TravelPlanning() {
  const { 
    activeAppointment, 
    travelData, 
    leaveAlert, 
    useCurrentGeolocation, 
    patientLocation, 
    setPatientLocation,
    setTravelData,
    attendingSpeed
  } = useQueue();

  const [addressSearch, setAddressSearch] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState("");

  const handleSearchAddress = async (e) => {
    e?.preventDefault();
    if (!addressSearch.trim()) return;

    setIsGeocoding(true);
    setGeocodeMsg("Geocoding location & extracting live route...");

    try {
      const geoResult = await mapsService.geocodeAddress(addressSearch);
      if (geoResult && geoResult.lat && geoResult.lng) {
        const newLoc = {
          address: geoResult.address,
          lat: geoResult.lat,
          lng: geoResult.lng
        };
        setPatientLocation(newLoc);

        // Fetch live ETA from backend or OSRM live routing
        const etaRes = await mapsService.getMapsETA({
          patientLat: geoResult.lat,
          patientLng: geoResult.lng,
          clinicLat: 28.5355,
          clinicLng: 77.3910
        });

        setTravelData(prev => ({
          ...prev,
          patientLocation: newLoc,
          distanceKm: etaRes.distance_km || 4.8,
          travelMinutes: etaRes.travel_minutes || 18,
          trafficLevel: etaRes.traffic_level || "Medium"
        }));

        setGeocodeMsg(`✅ Resolved: ${geoResult.address.substring(0, 60)}...`);
      } else {
        setGeocodeMsg("❌ Location not found. Please try a specific city/place name.");
      }
    } catch (err) {
      setGeocodeMsg("❌ Failed to resolve address. Using current GPS location.");
    } finally {
      setIsGeocoding(false);
      setTimeout(() => setGeocodeMsg(""), 5000);
    }
  };

  const handleSelectPresetLocation = (address, lat, lng, dist, mins) => {
    const loc = { address, lat, lng };
    setPatientLocation(loc);
    setTravelData(prev => ({
      ...prev,
      patientLocation: loc,
      distanceKm: dist,
      travelMinutes: mins
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
              Maps & Travel Logistics Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Real-time traffic analysis, live address geocoding & departure notifications.
            </p>
          </div>
        </div>

        <Link to="/patient/live-queue">
          <Button variant="outline" size="sm">
            Back to Queue
          </Button>
        </Link>
      </div>

      {/* Live Address Search & Geolocation Widget */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Patient Origin Location</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl truncate">
              Active: <strong className="text-slate-800">{patientLocation?.address || "Connaught Place, New Delhi"}</strong>
            </p>
          </div>

          <button
            onClick={useCurrentGeolocation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer flex-shrink-0"
          >
            <Crosshair className="w-4 h-4" />
            <span>Detect My GPS Location</span>
          </button>
        </div>

        {/* Real-time Address Search Bar */}
        <form onSubmit={handleSearchAddress} className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Search Any Place / Hospital Address in India or World:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="e.g. Saroj Super Speciality Hospital Delhi, Rohini Sector 7, Noida Sec 62..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={isGeocoding}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 flex-shrink-0"
            >
              {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Extract Route</span>
            </button>
          </div>
          {geocodeMsg && (
            <p className="text-xs font-bold text-brand-700 pt-1">{geocodeMsg}</p>
          )}
        </form>

        {/* Quick Location Presets */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Or Select Quick Sample Location:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleSelectPresetLocation("Connaught Place, Central Delhi", 28.6139, 77.2090, 4.8, 18)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-left text-xs font-semibold transition-all"
            >
              <div className="font-bold text-slate-800">Connaught Place</div>
              <div className="text-[10px] text-slate-400">4.8 km • ~18 mins</div>
            </button>

            <button
              onClick={() => handleSelectPresetLocation("South Extension, South Delhi", 28.5684, 77.2201, 8.2, 26)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-left text-xs font-semibold transition-all"
            >
              <div className="font-bold text-slate-800">South Extension</div>
              <div className="text-[10px] text-slate-400">8.2 km • ~26 mins</div>
            </button>

            <button
              onClick={() => handleSelectPresetLocation("Sector 62, Noida", 28.6280, 77.3649, 14.5, 34)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-left text-xs font-semibold transition-all"
            >
              <div className="font-bold text-slate-800">Sector 62, Noida</div>
              <div className="text-[10px] text-slate-400">14.5 km • ~34 mins</div>
            </button>

            <button
              onClick={() => handleSelectPresetLocation("Dwarka Sector 21, West Delhi", 28.5529, 77.0585, 21.0, 45)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-left text-xs font-semibold transition-all"
            >
              <div className="font-bold text-slate-800">Dwarka Sec 21</div>
              <div className="text-[10px] text-slate-400">21.0 km • ~45 mins</div>
            </button>
          </div>
        </div>
      </div>

      {/* Leave Now Alert Banner */}
      {leaveAlert && (
        <LeaveNowAlert
          leaveAlert={leaveAlert}
          travelData={travelData}
        />
      )}

      {/* Route & Map Card */}
      <TravelMapCard
        travelData={travelData}
        appointment={activeAppointment}
      />
    </div>
  );
}
