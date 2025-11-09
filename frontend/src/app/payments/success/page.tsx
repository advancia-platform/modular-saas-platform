"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Home, Receipt, CreditCard, Bitcoin } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "confirmed" | "pending">("checking");
  const [details, setDetails] = useState<any>(null);
  const [type, setType] = useState<"stripe" | "crypto" | null>(null);

  const sessionId = searchParams.get("session_id");
  const invoiceId = searchParams.get("invoice_id");

  useEffect(() => {
    checkPayment();
    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [sessionId, invoiceId]);

  useEffect(() => {
    if (status === "confirmed") {
      setTimeout(() => router.push("/dashboard"), 5000);
    }
  }, [status]);

  const checkPayment = async () => {
    const token = localStorage.getItem("token");
    
    if (sessionId) {
      setType("stripe");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
        setStatus(data.payment_status === "paid" ? "confirmed" : "pending");
      }
    }
    
    if (invoiceId) {
      setType("crypto");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cryptomus/status/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
        setStatus("pending"); // Crypto requires admin approval
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full"
      >
        {/* Payment Type Badge */}
        {type && (
          <div className="flex justify-center mb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              type === "stripe" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
            }`}>
              {type === "stripe" ? <><CreditCard className="w-4 h-4" /><span className="text-sm font-semibold">Card Payment</span></> : <><Bitcoin className="w-4 h-4" /><span className="text-sm font-semibold">Crypto Payment</span></>}
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === "checking" ? (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
          ) : status === "confirmed" ? (
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          {status === "checking" && "Verifying Payment..."}
          {status === "confirmed" && "Payment Successful! 🎉"}
          {status === "pending" && "Payment Received!"}
        </h1>

        {/* Description */}
        <div className="text-center mb-8">
          {status === "confirmed" && (
            <p className="text-gray-700 text-lg">Your payment has been confirmed and processed!</p>
          )}
          {status === "pending" && type === "crypto" && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <p className="text-sm font-semibold text-orange-900">Admin Approval Required</p>
              <p className="text-sm text-gray-700 mt-2">Your crypto payment has been received. Admin will review and credit your account within 15-60 minutes.</p>
            </div>
          )}
        </div>

        {/* Payment Details */}
        {details && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Payment Receipt</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-xl">{details.amount_total ? `$${(details.amount_total / 100).toFixed(2)}` : `${details.currency} ${details.amount}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {status === "confirmed" ? "Confirmed" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Go to Dashboard
        </button>

        {status === "confirmed" && (
          <p className="text-center text-xs text-gray-400 mt-4 animate-pulse">Redirecting in 5 seconds...</p>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto text-purple-400 animate-spin" />
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
