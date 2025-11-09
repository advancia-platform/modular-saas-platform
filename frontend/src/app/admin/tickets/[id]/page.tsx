"use client";

import { useEffect, useState, useCallback } from "react";
import adminApi from "@/lib/adminApi";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  userId: string;
  createdAt: string;
};

type ChatMsg = {
  id: string;
  sessionId: string;
  senderType: "user" | "admin" | "bot";
  content: string;
  createdAt: string;
};
type Related = {
  user: {
    id: string;
    email: string;
    username: string;
    usdBalance: string;
    createdAt: string;
  } | null;
  transactions: Array<{
    id: string;
    amount: string;
    type: string;
    status: string;
    createdAt: string;
    description?: string | null;
  }>;
  cryptoOrders: Array<{
    id: string;
    cryptoType: string;
    usdAmount: string;
    status: string;
    createdAt: string;
    txHash?: string | null;
  }>;
  cryptoWithdrawals: Array<{
    id: string;
    cryptoType: string;
    cryptoAmount: string;
    status: string;
    createdAt: string;
    txHash?: string | null;
  }>;
};

export default function AdminTicketDetail({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [includeMessages, setIncludeMessages] = useState<boolean>(true);
  const [includeRelated, setIncludeRelated] = useState<boolean>(true);
  const [related, setRelated] = useState<Related | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (includeMessages) params.includeMessages = "1";
      if (includeRelated) params.includeRelated = "1";
      const r = await adminApi.get(`/api/support/admin/tickets/${id}`, {
        params,
      });
      const data = r.data as {
        ticket: Ticket;
        messages?: ChatMsg[];
        related?: Related | null;
      };
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setRelated(data.related || null);
    } catch {
      // adminApi will handle 401 and redirect; keep silent here
    } finally {
      setLoading(false);
    }
  }, [id, includeMessages, includeRelated]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ticket Details</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={includeMessages}
              onChange={(e) => setIncludeMessages(e.target.checked)}
            />
            Include chat history
          </label>
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={includeRelated}
              onChange={(e) => setIncludeRelated(e.target.checked)}
            />
            Include related user/crypto
          </label>
          <button onClick={load} className="px-3 py-1 border rounded">
            Refresh
          </button>
        </div>
      </div>
      {loading && <div>Loading…</div>}
      {!loading && ticket && (
        <div className="space-y-3">
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
            <div className="font-semibold">{ticket.subject}</div>
            <div className="text-sm mb-2">
              Status: {ticket.status} • Priority: {ticket.priority} • User:{" "}
              {ticket.userId}
            </div>
            <div className="text-sm whitespace-pre-wrap">{ticket.message}</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold mb-2">Chat History</div>
            {messages.length === 0 && (
              <div className="text-sm text-gray-600">
                No messages or persistence disabled.
              </div>
            )}
            {messages.length > 0 && (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="text-gray-500">
                      [{new Date(m.createdAt).toLocaleString()}] {m.senderType}:
                    </span>{" "}
                    {m.content}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold mb-2">Related User & Crypto</div>
            {!related && (
              <div className="text-sm text-gray-600">Not requested.</div>
            )}
            {related && (
              <div className="space-y-3">
                <div>
                  <div className="font-medium">User</div>
                  {related.user ? (
                    <div className="text-sm text-gray-800">
                      {related.user.username || related.user.email} •{" "}
                      {related.user.email} • Balance: ${related.user.usdBalance}{" "}
                      • Joined{" "}
                      {new Date(related.user.createdAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No user found.</div>
                  )}
                </div>
                <div>
                  <div className="font-medium">Recent Transactions</div>
                  {related.transactions.length === 0 ? (
                    <div className="text-sm text-gray-600">None</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5">
                      {related.transactions.map((t) => (
                        <li key={t.id}>
                          {new Date(t.createdAt).toLocaleString()}: {t.type}{" "}
                          {t.amount} • {t.status}{" "}
                          {t.description ? `• ${t.description}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="font-medium">Recent Crypto Orders</div>
                  {related.cryptoOrders.length === 0 ? (
                    <div className="text-sm text-gray-600">None</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5">
                      {related.cryptoOrders.map((o) => (
                        <li key={o.id}>
                          {new Date(o.createdAt).toLocaleString()}:{" "}
                          {o.cryptoType} ${o.usdAmount} • {o.status}{" "}
                          {o.txHash ? `• ${o.txHash}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="font-medium">Recent Crypto Withdrawals</div>
                  {related.cryptoWithdrawals.length === 0 ? (
                    <div className="text-sm text-gray-600">None</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5">
                      {related.cryptoWithdrawals.map((w) => (
                        <li key={w.id}>
                          {new Date(w.createdAt).toLocaleString()}:{" "}
                          {w.cryptoType} {w.cryptoAmount} • {w.status}{" "}
                          {w.txHash ? `• ${w.txHash}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
