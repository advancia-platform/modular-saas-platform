import { useState } from "react";
import { trackEvent } from "@/lib/marketing";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "sending" | "ok" | "error">(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("ok");
        setMessage(
          "✅ Thanks for subscribing! Check your email for confirmation."
        );
        setEmail("");

        // Track conversion
        trackEvent("newsletter_signup", "engagement", email.split("@")[1]);
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "❌ Subscription failed. Please try again.");
        trackEvent("newsletter_signup_failed", "engagement", data.error);
      }
    } catch (err) {
      setStatus("error");
      setMessage("❌ Network error. Please try again.");
      console.error("Newsletter signup error:", err);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending"}
            className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-4 py-2 rounded hover:from-indigo-600 hover:to-pink-600 disabled:opacity-50 transition-all"
          >
            {status === "sending" ? "Sending..." : "Subscribe"}
          </button>
        </div>

        {message && (
          <p
            className={`text-sm ${
              status === "ok" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-xs text-gray-500">
          Get updates on new features, crypto recovery tips, and exclusive
          rewards.
        </p>
      </div>
    </form>
  );
}

/**
 * Compact newsletter signup for footer
 */
export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "sending" | "ok" | "error">(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("sending");

    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("ok");
        setEmail("");
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus(null), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1">
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "sending"}
        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "sending" || status === "ok"}
        className={`px-3 py-1 text-sm rounded text-white transition-all ${
          status === "ok"
            ? "bg-green-500"
            : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        }`}
      >
        {status === "sending" ? "..." : status === "ok" ? "✓" : "Subscribe"}
      </button>
    </form>
  );
}
