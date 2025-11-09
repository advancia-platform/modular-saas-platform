"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RealtimeDemoPage() {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  type EventItem = { ts: string; type: string; payload: unknown };
  const [events, setEvents] = useState<EventItem[]>([]);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  const disabled = useMemo(() => !token, [token]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect?.();
    };
  }, []);

  function connect() {
    try {
      const socket = connectSocket(API_URL, token);
      socketRef.current = socket;
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      const add = (type: string, payload: unknown) =>
        setEvents((prev) => [{ ts: new Date().toISOString(), type, payload }, ...prev].slice(0, 200));
      socket.on("notification", (p: unknown) => add("notification", p));
      socket.on("notifications:read", (p: unknown) => add("notifications:read", p));
      socket.on("notifications:all-read", () => add("notifications:all-read", {}));
      socket.on("notifications:unread-count", (p: unknown) => add("notifications:unread-count", p));
      socket.on("transaction-created", (p: unknown) => add("transaction-created", p));
      socket.on("global-transaction", (p: unknown) => add("global-transaction", p));
      socket.on("admin:transaction", (p: unknown) => add("admin:transaction", p));
  socket.on("balance-updated", (p: unknown) => add("balance-updated", p));
    } catch (e) {
      console.error(e);
    }
  }

  function disconnect() {
    socketRef.current?.disconnect?.();
    setConnected(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Realtime Demo</h1>
      <p className="text-sm text-gray-600 mb-4">Provide a JWT, then connect to see live notifications and transactions.</p>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Paste Bearer token here"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {!connected ? (
          <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={connect} disabled={disabled}>
            Connect
          </button>
        ) : (
          <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={disconnect}>
            Disconnect
          </button>
        )}
      </div>
      <div className="border rounded p-3 h-[480px] overflow-auto bg-gray-50">
        {events.length === 0 ? (
          <div className="text-gray-500">No events yet. Create a transaction or trigger a notification.</div>
        ) : (
          <ul className="space-y-2">
            {events.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="text-gray-400">[{e.ts}]</span> <span className="font-mono text-blue-700">{e.type}</span>
                <pre className="whitespace-pre-wrap break-all bg-white border rounded p-2 text-xs mt-1">{JSON.stringify(e.payload, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
