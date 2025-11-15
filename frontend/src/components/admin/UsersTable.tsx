"use client";

import PaginationControls from "@/components/PaginationControls";
import RoleBadge from "@/components/RoleBadge";
import SortControls from "@/components/SortControls";
import adminApi from "@/lib/adminApi";
import { Download, Lock, Users, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  usdBalance?: string;
};

interface UsersApiResponse {
  items: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function UsersTable() {
  const router = useRouter();
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [role, setRole] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Load whenever filters change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page,
          pageSize,
          sortField,
          sortOrder,
        };
        if (role) params.role = role;
        if (debouncedSearch) params.search = debouncedSearch;
        const { data } = await adminApi.get<UsersApiResponse>(
          "/api/admin/users",
          { params }
        );
        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, role, debouncedSearch, sortField, sortOrder]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  async function toggleRole(u: AdminUserRow) {
    const next = u.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await adminApi.patch(`/api/admin/users/${u.id}/role`, { role: next });
      toast.success(`Role updated to ${next}`);
      // Reload current page
      const params: Record<string, string | number> = {
        page,
        pageSize,
        sortField,
        sortOrder,
      };
      if (role) params.role = role;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await adminApi.get<UsersApiResponse>(
        "/api/admin/users",
        { params }
      );
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to update role");
    }
  }

  function toggleSelectAll() {
    if (selectedUsers.size === items.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(items.map((u) => u.id)));
    }
  }

  function toggleSelectUser(userId: string) {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedUsers.size === 0) {
      toast.error("Please select users and an action");
      return;
    }

    const userIds = Array.from(selectedUsers);
    const confirmMsg = `Are you sure you want to ${bulkAction} ${userIds.length} user(s)?`;

    if (!confirm(confirmMsg)) return;

    try {
      let endpoint = "";
      const body: Record<string, unknown> = { userIds };

      switch (bulkAction) {
        case "activate":
          endpoint = "/api/admin/bulk/activate-users";
          body.active = true;
          break;
        case "deactivate":
          endpoint = "/api/admin/bulk/activate-users";
          body.active = false;
          break;
        case "delete":
          endpoint = "/api/admin/bulk/delete-users";
          break;
        case "make-admin":
          endpoint = "/api/admin/bulk/assign-role";
          body.role = "ADMIN";
          break;
        case "make-user":
          endpoint = "/api/admin/bulk/assign-role";
          body.role = "USER";
          break;
        case "reset-password":
          endpoint = "/api/admin/bulk/reset-password";
          break;
        case "verify-email":
          endpoint = "/api/admin/bulk/verify-email";
          break;
        case "export":
          endpoint = "/api/admin/bulk/export-users";
          break;
        case "enable-gpt5":
          endpoint = "/api/admin/bulk/enable-gpt5";
          body.gpt5Enabled = true;
          break;
        default:
          toast.error("Unknown action");
          return;
      }

      const response = await adminApi.post(endpoint, body);

      if (bulkAction === "export") {
        // Download CSV
        const blob = new Blob([response.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Users exported successfully");
      } else {
        toast.success(response.data.message || "Action completed");
      }

      // Reload table
      setSelectedUsers(new Set());
      setBulkAction("");
      const params: Record<string, string | number> = {
        page,
        pageSize,
        sortField,
        sortOrder,
      };
      if (role) params.role = role;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await adminApi.get<UsersApiResponse>(
        "/api/admin/users",
        { params }
      );
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Bulk action failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header / Controls */}
      <div className="rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="opacity-80 text-sm">
            Manage roles and review user status
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Row */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex gap-2 items-center">
                <input
                  aria-label="Search users"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name or email"
                  className="border rounded px-3 py-2 w-64"
                />
                <select
                  aria-label="Filter by role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-3 py-2"
                >
                  <option value="">All roles</option>
                  <option value="USER">User</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {total} total
                </span>
                <select
                  aria-label="Items per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded px-2 py-2"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}/page
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sorting Controls Row */}
            <SortControls
              sortField={sortField}
              setSortField={(field) => {
                setSortField(field);
                setPage(1);
              }}
              sortOrder={sortOrder}
              setSortOrder={(order) => {
                setSortOrder(order);
                setPage(1);
              }}
            />

            {/* Quick Role Filter Buttons */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quick Filters:
              </span>
              <button
                onClick={() => {
                  setRole("");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  role === ""
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => {
                  setRole("USER");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  role === "USER"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                👥 Users Only
              </button>
              <button
                onClick={() => {
                  setRole("ADMIN");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  role === "ADMIN"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                👑 Admins Only
              </button>
              <button
                onClick={() => {
                  setRole("STAFF");
                  setPage(1);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  role === "STAFF"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                🛠️ Staff Only
              </button>
            </div>

            {/* Bulk Actions Row */}
            {selectedUsers.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedUsers.size} user(s) selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select action...</option>
                  <option value="activate">✓ Activate</option>
                  <option value="deactivate">✗ Deactivate</option>
                  <option value="make-admin">⬆ Make Admin</option>
                  <option value="make-user">⬇ Make User</option>
                  <option value="verify-email">✉ Verify Email</option>
                  <option value="reset-password">
                    <Lock className="inline w-4 h-4" /> Reset Password
                  </option>
                  <option value="export">
                    <Download className="inline w-4 h-4" /> Export CSV
                  </option>
                  <option value="enable-gpt5">🤖 Enable GPT-5</option>
                  <option value="delete">
                    <UserX className="inline w-4 h-4" /> Delete
                  </option>
                </select>
                <button
                  onClick={executeBulkAction}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="px-3 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-3 text-sm font-medium w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size === items.length && items.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                    aria-label="Select all users"
                  />
                </th>
                <th className="px-4 py-3 text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    No users found
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="w-4 h-4 rounded border-gray-300"
                        aria-label={`Select ${u.email}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-xs text-gray-500">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          u.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          aria-label={`Toggle role for ${u.email}`}
                          onClick={() => toggleRole(u)}
                          className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {u.role === "ADMIN" ? "Make User" : "Make Admin"}
                        </button>
                        <button
                          aria-label={`View details for ${u.email}`}
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationControls
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
