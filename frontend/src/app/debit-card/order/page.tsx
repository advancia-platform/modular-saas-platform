"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DebitCardOrderPage() {
  const [price, setPrice] = useState<number>(1000);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/debit-card/config`);
        const j = await r.json();
        if (typeof j.priceUSD === 'number') setPrice(j.priceUSD);
      } catch {}
    })();
  }, []);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/debit-card/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ fullName, address, phone, notes }),
      });
      if (!res.ok) { const j = await res.json().catch(()=>({})); throw new Error(j.error || `Failed: ${res.status}`); }
      const data = await res.json();
      if (data?.url) window.location.href = data.url; else throw new Error('No checkout URL');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Order Your Physical Debit Card</h1>
      <p className="text-gray-600">Current price: <span className="font-semibold">${price.toLocaleString()}</span> USD. Admin approval is required before fulfillment.</p>
      <div className="grid gap-3">
        <input className="border rounded px-3 py-2" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Shipping address" value={address} onChange={e=>setAddress(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)} />
        <textarea className="border rounded px-3 py-2" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
        <textarea className="border rounded px-3 py-2" placeholder="Paste your JWT token" value={token} onChange={e=>setToken(e.target.value)} />
      </div>
      <button onClick={submit} disabled={loading || !token || !fullName || !address || !phone} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? 'Processing…' : `Pay $${price.toLocaleString()} and Submit`}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
