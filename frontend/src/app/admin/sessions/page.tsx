"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { ensureToken, logout } from "@/utils/auth";
import adminApi from "@/lib/adminApi";

interface SessionInfo {
  email: string;
  role: string;
  createdAt: string;
}

let socket: Socket | null = null;

export default function SessionManager() {
  const [sessions, setSessions] = useState<Record<string, SessionInfo>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function revoke(token: string) {
    const adminToken = await ensureToken();
    if (!adminToken) {
      router.push("/admin/login");
      return;
    }

    try {
      await adminApi.post("/api/sessions/revoke", { token });
    } catch (err) {
      console.error("Failed to revoke session:", err);
    }
  }

  useEffect(() => {
    const init = async () => {
      const token = await ensureToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }

      // Connect to Socket.IO
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
        auth: { token },
      });

      socket.on("sessions:update", (data) => {
        setSessions(data);
        setLoading(false);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setLoading(false);
      });
    };

    init();

    return () => {
      if (socket) {
        socket.off("sessions:update");
        socket.disconnect();
      }
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🧠 Active Admin Sessions
          </h1>
          <button
            onClick={() => logout(router)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {Object.entries(sessions).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No active sessions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(sessions).map(([token, info]) => (
                <div
                  key={token}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-800">Email:</strong>{" "}
                      {info.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-800">Role:</strong>{" "}
                      {info.role}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong className="text-gray-800">Created:</strong>{" "}
                      {new Date(info.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold"
                    onClick={() => revoke(token)}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/admin/subscribers")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to Subscribers
          </button>
        </div>
      </div>
    </div>
  );
}
