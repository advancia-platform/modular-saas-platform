"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader, Mail } from "lucide-react";
import Link from "next/link";

function VerifySignupContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-signup/${token}`);
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setUserEmail(data.email);
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 max-w-lg w-full">
        {status === "loading" && (
          <div className="text-center py-12">
            <Loader className="animate-spin mx-auto mb-6 text-blue-600" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Verifying Your Email...
            </h2>
            <p className="text-gray-600">Please wait while we verify your account.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-8">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle size={56} className="text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              ✅ Email Verified!
            </h2>

            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Your email <strong className="text-green-600">{userEmail}</strong> has been successfully verified.
            </p>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-6 text-left">
              <div className="flex items-start mb-4">
                <Mail size={24} className="text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-gray-800 mb-2">
                    🎉 Account Pending Admin Approval
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    Your account has been created and is now waiting for admin review.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white bg-opacity-50 p-3 rounded">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>📧 What happens next?</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
                    <li>Admin team will review your account</li>
                    <li>You&apos;ll receive an email when approved</li>
                    <li>Expected approval time: 24-48 hours</li>
                    <li>After approval, you can login without a password!</li>
                  </ul>
                </div>

                <div className="bg-blue-100 bg-opacity-50 p-3 rounded">
                  <p className="text-xs font-medium text-blue-800">
                    💡 <strong>Important:</strong> Save this email - <strong>{userEmail}</strong> - you&apos;ll use it to login!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-center"
              >
                Go to Login Page
              </Link>

              <Link
                href="/"
                className="block text-gray-600 hover:text-gray-800 text-sm font-medium transition text-center"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="bg-gradient-to-br from-red-400 to-rose-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <XCircle size={56} className="text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              ❌ Verification Failed
            </h2>

            <p className="text-gray-600 mb-6 text-sm sm:text-base">{message}</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6 text-left">
              <p className="font-medium text-red-800 mb-3 text-sm">
                Possible reasons:
              </p>
              <ul className="space-y-2 text-xs text-red-700 list-disc list-inside">
                <li>The verification link has expired (24 hour limit)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/email-signup"
                className="block w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg text-center"
              >
                Request New Magic Link
              </Link>

              <Link
                href="/auth/login"
                className="block text-gray-600 hover:text-gray-800 text-sm font-medium transition text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifySignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifySignupContent />
    </Suspense>
  );
}
