"use client";

import { useCallback, useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  userId: string;
  createdAt: string;
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (status) params.status = status;
      if (q) params.q = q;
      const { data } = await adminApi.get("/api/support/admin/tickets", {
        params,
      });
      setTickets(data.items || []);
      setTotal(data.total || 0);
    } catch {
      // handled globally by adminApi; keep UI resilient
    } finally {
      setLoading(false);
    }
  }, [status, q, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Support Tickets</h1>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search subject or message"
            className="border rounded px-2 py-1"
          />
          <button onClick={load} className="px-3 py-1 border rounded">
            Refresh
          </button>
        </div>
      </div>
      <div className="grid gap-3">
        {loading && <div>Loading…</div>}
        {!loading &&
          tickets.map((t) => (
            <div key={t.id} className="border rounded p-3">
              <div className="text-xs text-gray-500">
                {new Date(t.createdAt).toLocaleString()}
              </div>
              <div className="font-semibold">{t.subject}</div>
              <div className="text-sm">
                Status: {t.status} • Priority: {t.priority} • User: {t.userId}
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={`/admin/tickets/${t.id}`}
                  className="px-3 py-1 border rounded"
                >
                  Details
                </a>
                <button
                  onClick={async () => {
                    await adminApi.post(
                      `/api/support/admin/tickets/${t.id}/status`,
                      { status: "IN_PROGRESS" }
                    );
                    load();
                  }}
                  className="px-3 py-1 border rounded"
                >
                  In Progress
                </button>
                <button
                  onClick={async () => {
                    await adminApi.post(
                      `/api/support/admin/tickets/${t.id}/status`,
                      { status: "RESOLVED" }
                    );
                    load();
                  }}
                  className="px-3 py-1 border rounded"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        {!loading && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))} •{" "}
              {total} total
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}/page
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
