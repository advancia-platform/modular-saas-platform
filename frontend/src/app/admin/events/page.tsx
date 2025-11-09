"use client";
import { useEffect, useRef, useState } from "react";
import RequireRole from "@/components/RequireRole";
import { connectSocket } from "@/lib/socket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminEventsPage() {
  const [token, setToken] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<Array<{ ts: string; type: string; payload: unknown }>>([]);
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect?.();
    };
  }, []);

  const add = (type: string, payload: unknown) =>
    setEvents((prev) => [{ ts: new Date().toISOString(), type, payload }, ...prev].slice(0, 300));

  const connect = () => {
    const s = connectSocket(API_URL, token);
    socketRef.current = s;
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    // Admin-focused events
    s.on("admin:bulk-credit", (p: unknown) => add("admin:bulk-credit", p));
    s.on("admin:bulk-credit:progress", (p: unknown) => add("admin:bulk-credit:progress", p));
    s.on("admin:bulk-credit:done", (p: unknown) => add("admin:bulk-credit:done", p));
    s.on("admin:transaction", (p: unknown) => add("admin:transaction", p));
    // General events
    s.on("global-transaction", (p: unknown) => add("global-transaction", p));
  };

  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Admin Event Stream</h1>
        <p className="text-sm text-gray-600 mb-4">Paste an admin JWT and connect to monitor admin events.</p>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Paste admin Bearer token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          {!connected ? (
            <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={connect} disabled={!token}>
              Connect
            </button>
          ) : (
            <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={() => socketRef.current?.disconnect?.()}>
              Disconnect
            </button>
          )}
        </div>
        <div className="border rounded p-3 h-[480px] overflow-auto bg-gray-50">
          {events.length === 0 ? (
            <div className="text-gray-500">No events yet. Trigger a bulk credit or wait for Stripe webhooks.</div>
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
    </RequireRole>
  );
}
