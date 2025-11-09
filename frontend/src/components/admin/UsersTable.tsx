"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import adminApi from "@/lib/adminApi";
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
        const params: Record<string, string | number> = { page, pageSize };
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
  }, [page, pageSize, role, debouncedSearch]);

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
      const params: Record<string, string | number> = { page, pageSize };
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
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
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
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
                      <div className="font-medium">{u.name || "—"}</div>
                      <div className="text-xs text-gray-500">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {u.role}
                      </span>
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
