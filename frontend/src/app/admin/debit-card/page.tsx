"use client";
import { useEffect, useState } from "react";
import RequireRole from "@/components/RequireRole";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminDebitCardPage() {
  const [price, setPrice] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const r = await fetch(`${API}/api/debit-card/admin/price`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const j = await r.json();
        if (typeof j.priceUSD === 'number') setPrice(String(j.priceUSD));
      } catch { setErr("Failed to load price"); }
      finally { setLoading(false); }
    })();
  }, []);

  async function save() {
    setMsg(null); setErr(null);
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${API}/api/debit-card/admin/price`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ priceUSD: parseFloat(price) }),
      });
      if (!r.ok) throw new Error(`Failed: ${r.status}`);
      setMsg("Price updated");
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  return (
  <RequireRole roles={["ADMIN"]}>
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Debit Card Pricing</h1>
        {loading ? <div>Loading…</div> : (
          <>
            <label className="block text-sm text-gray-600 mb-1">Price (USD)</label>
            <input className="border rounded px-3 py-2 w-full" type="number" min="1" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} />
            <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
            {msg && <div className="text-green-700 text-sm">{msg}</div>}
            {err && <div className="text-red-600 text-sm">{err}</div>}
          </>
        )}
      </div>
    </RequireRole>
  );
}
