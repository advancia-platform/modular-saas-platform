"use client";

import { useState } from "react";
import { Mail, CheckCircle, ArrowLeft, Loader } from "lucide-react";
import Link from "next/link";

export default function EmailSignupPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 max-w-md w-full">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Login
        </Link>

        {!success ? (
          <>
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail size={40} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
                Sign Up with Email
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                No password needed! We&apos;ll send you a magic link to complete registration.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Sending Magic Link...
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    Send Magic Link
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  🔐 How it works:
                </p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Enter your email above</li>
                  <li>We send you a magic link</li>
                  <li>Click the link to verify</li>
                  <li>Admin approves your account</li>
                  <li>You can login! (No password needed)</li>
                </ol>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle size={48} className="text-white" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              ✅ Check Your Email!
            </h2>
            
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              We&apos;ve sent a magic link to <strong className="text-blue-600">{email}</strong>
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-5 rounded-lg mb-6 text-left">
              <p className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                📧 Next Steps:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">1.</span>
                  <span>Check your inbox (and spam folder)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">2.</span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">3.</span>
                  <span>Your account will be sent for admin approval</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">4.</span>
                  <span>You&apos;ll receive confirmation when approved</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>⏰ Link expires in 24 hours</strong>
              </p>
            </div>

            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/auth/resend-magic-link", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    alert("✅ New magic link sent!");
                  } else {
                    alert("❌ " + data.error);
                  }
                } catch {
                  alert("Failed to resend link");
                } finally {
                  setLoading(false);
                }
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-4 transition"
            >
              Didn&apos;t receive the email? Resend
            </button>

            <div className="pt-4 border-t">
              <Link
                href="/auth/login"
                className="inline-block text-gray-600 hover:text-gray-800 font-medium text-sm transition"
              >
                ← Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
