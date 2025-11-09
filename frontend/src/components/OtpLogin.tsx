"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMethod = "email";
type Step = "enter-identifier" | "enter-code";

export default function OtpLogin() {
  const [step, setStep] = useState<Step>("enter-identifier");
  const [authMethod] = useState<AuthMethod>("email"); // Fixed to email only
  const [identifier, setIdentifier] = useState(""); // email
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) {
      return err.message;
    }
    return "Unexpected error";
  };

  // Send Email OTP
  const sendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setMessage(data.message);
      if (data.code) {
        setMessage(`${data.message} | Code: ${data.code} (dev mode)`);
      }
      setStep("enter-code");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg">
      {/* Enter Email */}
      {step === "enter-identifier" && (
        <>
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Email Login
          </h2>
          <p className="text-gray-600 mb-6">
            We&apos;ll send you a verification code
          </p>

          <input
            type="email"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            disabled={loading}
          />

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={sendOtp}
            disabled={loading || !identifier}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </>
      )}

      {/* Enter Code */}
      {step === "enter-code" && (
        <>
          <button
            onClick={() => setStep("enter-identifier")}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Enter Verification Code
          </h2>
          <p className="text-gray-600 mb-6">
            Check your email for the code
          </p>

          {message && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm mb-4">
              {message}
            </div>
          )}

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest mb-4"
            disabled={loading}
          />

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={verifyOtp}
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </>
      )}
    </div>
  );
}
