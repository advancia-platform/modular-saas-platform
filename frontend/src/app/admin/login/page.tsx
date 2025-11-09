"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin OTP login page
 * Note: Uses direct fetch instead of adminApi since this is pre-auth
 * (tokens don't exist yet). Once logged in, admin pages use adminApi.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitReset, setRateLimitReset] = useState<Date | null>(null);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isRateLimited) {
      setError(
        `Too many attempts. Please try again ${
          rateLimitReset ? `at ${rateLimitReset.toLocaleTimeString()}` : "later"
        }.`
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setIsRateLimited(true);
          const resetTime = new Date();
          resetTime.setMinutes(resetTime.getMinutes() + 30);
          setRateLimitReset(resetTime);
          setError("Too many login attempts. Please try again in 30 minutes.");
          return;
        }

        setAttemptsLeft((prev) => Math.max(0, prev - 1));
        setError(data.error || "Login failed");
        return;
      }

      if (data.step === "verify_otp") {
        setStep("otp");
        setError(""); // Clear any previous errors
        setAttemptsLeft(3); // Reset attempts for OTP phase
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setIsRateLimited(true);
          const resetTime = new Date();
          resetTime.setMinutes(resetTime.getMinutes() + 30);
          setRateLimitReset(resetTime);
          setError(
            "Too many verification attempts. Please try again in 30 minutes."
          );
          return;
        }

        setAttemptsLeft((prev) => Math.max(0, prev - 1));
        setError(data.error || "Invalid OTP");
        return;
      }

      // Store tokens and redirect
      localStorage.setItem("adminToken", data.accessToken);
      localStorage.setItem("adminRefreshToken", data.refreshToken);
      router.push("/admin/sessions");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "credentials" ? "Admin Login" : "Verify OTP"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === "credentials"
              ? "Secure administrator access"
              : "Enter the code sent to your phone"}
          </p>
        </div>

        {error && (
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
            {attemptsLeft < 3 && !isRateLimited && (
              <p className="text-sm text-yellow-600 text-center">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@advancia.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+15551234567"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Include country code (e.g., +1 for USA)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="123456"
                maxLength={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1 text-center">
                Check your phone for a 6-digit code
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            🔒 Protected by SMS verification
          </p>
        </div>
      </div>
    </div>
  );
}
