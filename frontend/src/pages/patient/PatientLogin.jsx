import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Smartphone, Send, ShieldCheck } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";

export default function PatientLogin() {
  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [countryCode, setCountryCode] = useState("IN +91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      loginWithPhone(`+91 ${phoneNumber}`);
      setLoading(false);
      navigate("/patient/otp");
    }, 600);
  };

  return (
    <AuthLayout title="Patient Portal" subtitle="Phone OTP Login" backTo="/">
      <div className="space-y-6">
        {/* Card Header matching reference Step 4 */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Login</h2>
          <p className="text-xs text-slate-500">
            Enter your registered mobile number to receive a secure one-time verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Phone Number
            </label>
            
            <div className="flex gap-2">
              <div className="w-28 px-3 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center">
                <span>{countryCode}</span>
              </div>

              <div className="relative flex-1">
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit number"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 outline-none text-slate-900 font-bold text-sm tracking-wide transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            )}
            <p className="text-[11px] text-slate-400">
              Demo phone prefilled. Click Send OTP to test.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={Send}
            iconPosition="right"
          >
            Send OTP via SMS
          </Button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-heal-600" />
          <span>256-bit Encrypted Healthcare Vault</span>
        </div>
      </div>
    </AuthLayout>
  );
}
