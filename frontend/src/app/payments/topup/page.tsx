"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TopUpPage() {
  const [amount, setAmount] = useState<string>("10");
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createSession() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed: ${res.status}`);
      }
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Top Up Balance</h1>
      <p className="text-sm text-gray-600">Enter an amount in USD, provide your JWT, and create a Stripe Checkout session.</p>
      {/* Premium quick amounts */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 mr-2">Premium amounts:</span>
        {[200, 500, 1000].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => setAmount(String(amt))}
            className="px-3 py-1.5 text-sm rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            ${'{'}amt.toLocaleString(){'}'}
          </button>
        ))}
      </div>
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Amount (USD)"
        type="number"
        min="1"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <textarea
        className="w-full border rounded px-3 py-2 h-24"
        placeholder="Paste JWT token here"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <button
        onClick={createSession}
        disabled={loading || !amount || !token}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Creating session..." : "Create Checkout Session"}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
