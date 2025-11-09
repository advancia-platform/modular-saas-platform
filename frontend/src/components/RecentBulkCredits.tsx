"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; amount: number; note: string | null; createdAt: string };

export default function RecentBulkCredits({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/api/admin/bulk-credits?page=${page}&pageSize=${limit}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        if (typeof data.totalPages === "number") setTotalPages(data.totalPages);
        if (typeof data.totalAmount === "number") setTotalAmount(data.totalAmount);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [limit, page]);

  return (
    <div className="p-4 bg-white shadow rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Recent Bulk Credits</h3>
        <Link href="/admin/events" className="text-sm text-indigo-600 hover:text-indigo-800">
          View events →
        </Link>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : error ? (
        <div className="text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded text-sm">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500 text-sm">No recent bulk credits.</div>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-600">
            Running total:
            <span className="font-semibold text-gray-900"> ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <ul className="divide-y divide-gray-200">
            {items.map((it) => (
              <li key={it.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">${it.amount.toLocaleString()}</div>
                  {it.note && <div className="text-xs text-gray-500">{it.note}</div>}
                </div>
                <div className="text-xs text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              ← Prev
            </button>
            <div className="text-gray-600">Page {page} of {totalPages}</div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
