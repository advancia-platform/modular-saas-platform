// Example React component showing payment status polling
"use client";

import { useEffect, useState } from "react";

interface PaymentStatus {
  status: "pending" | "confirmed" | "failed" | "not_found";
  amount?: number;
  createdAt?: string;
  paidAt?: string;
}

export default function PaymentStatusPage({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment-status?orderId=${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch payment status");
        }

        setStatus(data);

        // If payment is still pending, poll again in 3 seconds
        if (data.status === "pending") {
          setTimeout(pollPaymentStatus, 3000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    // Start polling
    pollPaymentStatus();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            Processing Payment...
          </h2>
          <p className="text-gray-600 mt-2">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (status?.status === "confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mt-2">
            Your payment of ${status.amount} has been confirmed.
          </p>
          {status.paidAt && (
            <p className="text-sm text-gray-500 mt-2">
              Confirmed at: {new Date(status.paidAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status?.status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Failed
          </h2>
          <p className="text-gray-600 mt-2">
            Your payment could not be processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-yellow-500 text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900">
          Payment Not Found
        </h2>
        <p className="text-gray-600 mt-2">
          We couldn't find a payment with that order ID.
        </p>
      </div>
    </div>
  );
}
