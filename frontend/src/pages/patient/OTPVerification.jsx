import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";

export default function OTPVerification() {
  const { pendingPhone, verifyOTP } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Prefill sample digits 1 2 3 4 5 6 for effortless instant review
  useEffect(() => {
    setOtp(["1", "2", "3", "4", "5", "6"]);
  }, []);

  // Resend Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      verifyOTP(fullOtp);
      setLoading(false);
      navigate("/patient/dashboard");
    }, 600);
  };

  const handleResend = () => {
    if (countdown === 0) {
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <AuthLayout title="Verification" backTo="/patient/login">
      <div className="space-y-6 text-center">
        {/* Header matching reference Step 5 */}
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verify your mobile number
          </h2>
          <p className="text-xs text-slate-500">
            We have sent a 6-digit OTP to{" "}
            <span className="font-bold text-slate-800">{pendingPhone || "+91 9876543210"}</span>
          </p>
        </div>

        {/* 6 Digit Inputs */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-2xl border transition-all outline-none ${
                  digit
                    ? "border-brand-500 bg-brand-50/40 text-brand-700 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          {/* Resend Timer */}
          <div className="text-xs text-slate-400">
            {countdown > 0 ? (
              <span>Resend OTP in 00:{String(countdown).padStart(2, "0")}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-brand-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
              </button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Verify & Continue
          </Button>
        </form>

        <div className="pt-2">
          <Link
            to="/patient/login"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Change mobile number
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
