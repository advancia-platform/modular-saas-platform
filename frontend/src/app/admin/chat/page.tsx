"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminChatMonitor() {
  type ChatEvent = { at: string; sessionId: string; from: string; userId?: string; message: string };
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [targetSession, setTargetSession] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [newTicketCount, setNewTicketCount] = useState<number>(0);
  const [toast, setToast] = useState<{ show: boolean; text: string }>({ show: false, text: "" });

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    if (!t) return;
    const s: Socket = io(API, { transports: ['websocket'], auth: { token: `Bearer ${t}` } });
    s.on('connect', () => {
      console.log('Admin chat monitor connected');
    });
    s.on('admin:chat:message', (payload) => {
      setEvents((e) => [payload, ...e].slice(0, 200));
    });
    // New ticket toast/badge
    s.on('admin:support:ticket', (ticket: { id: string; subject: string; userId: string; createdAt: string }) => {
      setEvents((e) => [{ at: new Date().toISOString(), sessionId: ticket.id, from: 'ticket', message: `New ticket: ${ticket.subject} by ${ticket.userId}` }, ...e]);
      setNewTicketCount((c: number) => c + 1);
      setToast({ show: true, text: `New support ticket: ${ticket.subject}` });
      setTimeout(() => setToast({ show: false, text: '' }), 3500);
    });
    return () => { s.disconnect(); };
  }, []);

  if (!token) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">Admin Chat Monitor</h1>
  <p className="text-sm text-gray-600">Paste an admin Bearer token into localStorage as &apos;token&apos; and reload.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 relative">
      <Header count={newTicketCount} />
      <div className="text-sm text-gray-600">Listening for user messages...</div>
      <div className="border rounded p-3 flex items-center gap-2">
        <input value={targetSession} onChange={(e) => setTargetSession(e.target.value)} placeholder="Session ID" className="border rounded px-2 py-1" />
        <input value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} placeholder="User ID (optional)" className="border rounded px-2 py-1" />
        <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply..." className="border rounded px-2 py-1 flex-1" />
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={async () => {
            if (!targetSession || !reply) return;
            const r = await fetch(`${API}/api/chat/admin/reply`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ sessionId: targetSession, message: reply, userId: targetUserId || undefined }),
            });
            if (r.ok) setReply("");
          }}
        >Send</button>
      </div>
      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={i} className="border rounded p-3">
            <div className="text-xs text-gray-500">{e.at}</div>
            <div className="font-medium">Session: {e.sessionId}</div>
            <div className="text-sm">From: {e.from}{e.userId ? ` (${e.userId})` : ''}</div>
            <div className="mt-1">{e.message}</div>
          </div>
        ))}
      </div>
      {toast.show && (
        <div className="fixed right-4 bottom-24 bg-white border shadow-lg rounded px-4 py-2 text-sm">
          {toast.text} <a href="/admin/tickets" className="text-blue-600 underline ml-2">View</a>
        </div>
      )}
    </div>
  );
}

function Header({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Admin Chat Monitor</h1>
      <a href="/admin/tickets" className="text-blue-600 hover:underline flex items-center gap-2">
        Tickets
        <span className="inline-flex items-center justify-center text-xs bg-red-600 text-white rounded-full w-5 h-5">{count}</span>
      </a>
    </div>
  );
}

