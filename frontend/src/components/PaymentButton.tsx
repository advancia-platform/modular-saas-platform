import { useState } from "react";

interface PaymentButtonProps {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PaymentButton({
  orderId,
  amount,
  currency,
  description = "Payment",
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePayment(provider: "stripe" | "cryptomus") {
    setLoading(provider);
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          provider,
          description,
        }),
      });

      const data = await res.json();

      if (data.redirectUrl) {
        // Redirect user to Stripe or Cryptomus checkout page
        window.location.href = data.redirectUrl;
        onSuccess?.();
      } else {
        const errorMsg = data.error || "Error creating payment session";
        onError?.(errorMsg);
        alert(`Payment Error: ${errorMsg}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed";
      console.error("Payment error:", err);
      onError?.(errorMsg);
      alert(`Payment failed: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handlePayment("stripe")}
        disabled={!!loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading === "stripe" ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span>💳</span>
        )}
        Pay with Stripe
      </button>

      <button
        onClick={() => handlePayment("cryptomus")}
        disabled={!!loading}
        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading === "cryptomus" ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span>₿</span>
        )}
        Pay with Crypto
      </button>
    </div>
  );
}
