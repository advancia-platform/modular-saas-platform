"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-rose-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-rose-600 mb-4">
          Payment Cancelled
        </h1>

        {/* Description */}
        <p className="text-slate-600 mb-6">
          No charges were made. You can restart the checkout process whenever
          you're ready.
        </p>

        {orderId && (
          <p className="text-sm text-slate-500 mb-6">
            Order ID:{" "}
            <code className="bg-slate-100 px-2 py-1 rounded text-xs">
              {orderId}
            </code>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
