"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface AlertPolicy {
  id: string;
  routeGroup: string;
  threshold: number;
  cooldown: number;
  mode: "IMMEDIATE" | "BATCHED" | "MIXED";
  batchIntervalMs?: number;
  channels: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface User {
  id: string;
  email: string;
  role: "USER" | "STAFF" | "ADMIN" | "SUPERADMIN";
}

export default function AlertPoliciesPage() {
  const [policies, setPolicies] = useState<AlertPolicy[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AlertPolicy>>({});
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    fetchPolicies();
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }

  async function fetchPolicies() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/alert-policies", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Access denied: Admin privileges required");
          return;
        }
        throw new Error("Failed to fetch policies");
      }

      const data = await res.json();
      setPolicies(data.policies);
      setCanEdit(data.canEdit);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
      toast.error("Failed to load alert policies");
    } finally {
      setLoading(false);
    }
  }

  async function startEdit(policy: AlertPolicy) {
    if (!canEdit) {
      toast.error("Only SuperAdmins can edit policies");
      return;
    }

    setEditing(policy.routeGroup);
    setEditForm({
      threshold: policy.threshold,
      cooldown: policy.cooldown,
      mode: policy.mode,
      batchIntervalMs: policy.batchIntervalMs,
      channels: policy.channels,
      severity: policy.severity,
      enabled: policy.enabled,
    });
  }

  async function savePolicy(routeGroup: string) {
    try {
      const reason = prompt("Reason for this change (for audit log):");
      if (!reason) {
        toast.error("Change reason is required for audit trail");
        return;
      }

      const res = await fetch(`/api/admin/alert-policies/${routeGroup}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...editForm, reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update policy");
      }

      const data = await res.json();
      toast.success(`Policy updated for ${routeGroup}`);

      // Update local state
      setPolicies((prev) =>
        prev.map((p) => (p.routeGroup === routeGroup ? data.policy : p))
      );

      setEditing(null);
      setEditForm({});
    } catch (err: any) {
      console.error("Failed to save policy:", err);
      toast.error(err.message || "Failed to save policy");
    }
  }

  async function togglePolicy(routeGroup: string, enabled: boolean) {
    try {
      const reason = prompt(
        `Reason for ${enabled ? "enabling" : "disabling"} this policy:`
      );
      if (!reason) {
        toast.error("Reason is required for audit trail");
        return;
      }

      const res = await fetch(
        `/api/admin/alert-policies/${routeGroup}/toggle`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ enabled, reason }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to toggle policy");
      }

      const data = await res.json();
      toast.success(
        `Policy ${enabled ? "enabled" : "disabled"} for ${routeGroup}`
      );

      setPolicies((prev) =>
        prev.map((p) => (p.routeGroup === routeGroup ? data.policy : p))
      );
    } catch (err) {
      console.error("Failed to toggle policy:", err);
      toast.error("Failed to toggle policy");
    }
  }

  function cancelEdit() {
    setEditing(null);
    setEditForm({});
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "LOW":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "MEDIUM":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      case "CRITICAL":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alert policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                ⚙️ Alert Policy Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage rate limit alert policies and thresholds
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Role:{" "}
                <span className="font-semibold">
                  {user?.role || "Loading..."}
                </span>
              </p>
              {canEdit ? (
                <span className="text-xs text-green-600">✓ Edit access</span>
              ) : (
                <span className="text-xs text-gray-500">🔒 Read-only</span>
              )}
            </div>
          </div>

          {/* RBAC Warning */}
          {!canEdit && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                🔒 <strong>View-Only Mode:</strong> Only SuperAdmins can edit
                alert policies. Contact a SuperAdmin to request changes.
              </p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            🛡️ <strong>Security:</strong> All policy changes are logged with
            user, timestamp, and reason. Audit logs are tamper-evident and
            monitored for anomalies.
          </p>
        </div>

        {/* Policies Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Threshold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cooldown (min)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr
                    key={policy.id}
                    className={!policy.enabled ? "bg-gray-50 opacity-60" : ""}
                  >
                    {/* Route Group */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {policy.routeGroup}
                      </span>
                    </td>

                    {/* Threshold */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing === policy.routeGroup ? (
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={editForm.threshold || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              threshold: parseInt(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {policy.threshold}
                        </span>
                      )}
                    </td>

                    {/* Mode */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing === policy.routeGroup ? (
                        <select
                          value={editForm.mode || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              mode: e.target.value as any,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="IMMEDIATE">Immediate</option>
                          <option value="BATCHED">Batched</option>
                          <option value="MIXED">Mixed</option>
                        </select>
                      ) : (
                        <span className="text-xs text-gray-600">
                          {policy.mode}
                        </span>
                      )}
                    </td>

                    {/* Cooldown */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing === policy.routeGroup ? (
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={Math.floor((editForm.cooldown || 0) / 60000)}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              cooldown: parseInt(e.target.value) * 60000,
                            })
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          {Math.floor(policy.cooldown / 60000)}
                        </span>
                      )}
                    </td>

                    {/* Channels */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {policy.channels.map((ch) => (
                          <span
                            key={ch}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing === policy.routeGroup ? (
                        <select
                          value={editForm.severity || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              severity: e.target.value as any,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(
                            policy.severity
                          )}`}
                        >
                          {policy.severity}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {policy.enabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ⏸ Disabled
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editing === policy.routeGroup ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => savePolicy(policy.routeGroup)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      ) : canEdit ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(policy)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() =>
                              togglePolicy(policy.routeGroup, !policy.enabled)
                            }
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white ${
                              policy.enabled
                                ? "bg-orange-600 hover:bg-orange-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {policy.enabled ? "⏸ Disable" : "▶ Enable"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          🔒 View Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            📋 {showAuditLog ? "Hide" : "View"} Audit Log
          </button>
        </div>

        {/* Audit Log Viewer */}
        {showAuditLog && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📋 Recent Policy Changes
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              All policy changes are logged with user, timestamp, and reason for
              audit and compliance purposes.
            </p>
            <div className="text-center text-gray-500 py-8">
              <p>Audit log viewer coming soon...</p>
              <p className="text-xs mt-2">
                Use the backend API endpoint{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  /api/admin/policy-audit
                </code>{" "}
                to view logs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
