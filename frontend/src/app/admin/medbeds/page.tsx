"use client";
import { useEffect, useState, useCallback } from "react";
import RequireRole from "@/components/RequireRole";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Booking = {
  id: string;
  userId: string;
  chamberType: string;
  chamberName: string;
  sessionDate: string;
  duration: number;
  cost: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  status: string;
  effectiveness?: number;
  notes?: string;
  createdAt: string;
  user?: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function AdminMedbedsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = filter !== "all" ? `?status=${filter}` : "";
      const r = await fetch(`${API}/api/medbeds/admin/bookings${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error(`Failed: ${r.status}`);
      const j = await r.json();
      setBookings(j);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const token = localStorage.getItem("token");
    const r = await fetch(`${API}/api/medbeds/admin/bookings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ status }),
    });
    if (r.ok) load();
  }

  async function updateEffectiveness(id: string, effectiveness: number) {
    const token = localStorage.getItem("token");
    const r = await fetch(`${API}/api/medbeds/admin/bookings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ effectiveness }),
    });
    if (r.ok) load();
  }

  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Med Beds Bookings</h1>
          <p className="text-gray-600">
            Manage all Med Beds appointments and sessions
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "scheduled"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilter("in-progress")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "in-progress"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "completed"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
            No bookings found
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Chamber
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Session Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {b.user?.firstName && b.user?.lastName
                              ? `${b.user.firstName} ${b.user.lastName}`
                              : b.user?.username || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {b.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {b.chamberName}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {b.chamberType}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {new Date(b.sessionDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {b.duration} min
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-900">
                          ${b.cost}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                              b.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : b.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {b.paymentMethod}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                            b.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : b.status === "in-progress"
                              ? "bg-purple-100 text-purple-800"
                              : b.status === "cancelled"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {b.status}
                        </span>
                        {b.effectiveness !== null &&
                          b.effectiveness !== undefined && (
                            <p className="text-xs text-gray-600 mt-1">
                              Effectiveness: {b.effectiveness}%
                            </p>
                          )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          {b.status === "scheduled" && (
                            <button
                              onClick={() => updateStatus(b.id, "in-progress")}
                              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                            >
                              Start Session
                            </button>
                          )}
                          {b.status === "in-progress" && (
                            <>
                              <button
                                onClick={() => {
                                  const effectiveness = prompt(
                                    "Enter effectiveness score (0-100):"
                                  );
                                  if (
                                    effectiveness &&
                                    !isNaN(Number(effectiveness))
                                  ) {
                                    updateEffectiveness(
                                      b.id,
                                      Math.min(
                                        100,
                                        Math.max(0, Number(effectiveness))
                                      )
                                    );
                                    updateStatus(b.id, "completed");
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {b.status !== "cancelled" &&
                            b.status !== "completed" && (
                              <button
                                onClick={() => {
                                  if (confirm("Cancel this booking?")) {
                                    updateStatus(b.id, "cancelled");
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
