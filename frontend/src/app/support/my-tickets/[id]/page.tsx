"use client";

import { useCallback, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Ticket = { id: string; subject: string; message: string; status: string; priority: string; createdAt: string };

type ChatMsg = { id: string; sessionId: string; senderType: 'user'|'admin'|'bot'; content: string; createdAt: string };

export default function MyTicketDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [includeMessages, setIncludeMessages] = useState<boolean>(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (includeMessages) qs.set('includeMessages', '1');
    const r = await fetch(`${API}/api/support/my/${id}?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const data = await r.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    }
    setLoading(false);
  }, [id, includeMessages]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Ticket</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={includeMessages} onChange={(e)=> setIncludeMessages(e.target.checked)} />Include chat history</label>
          <button onClick={load} className="px-3 py-1 border rounded">Refresh</button>
        </div>
      </div>
      {loading && <div>Loading…</div>}
      {!loading && ticket && (
        <div className="space-y-3">
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</div>
            <div className="font-semibold">{ticket.subject}</div>
            <div className="text-sm mb-2">Status: {ticket.status} • Priority: {ticket.priority}</div>
            <div className="text-sm whitespace-pre-wrap">{ticket.message}</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-semibold mb-2">Chat History</div>
            {messages.length === 0 && <div className="text-sm text-gray-600">No messages or persistence disabled.</div>}
            {messages.length > 0 && (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="text-gray-500">[{new Date(m.createdAt).toLocaleString()}] {m.senderType}:</span> {m.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
