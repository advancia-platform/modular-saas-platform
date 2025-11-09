"use client";
import RequireRole from "@/components/RequireRole";
import UsersTable from "@/components/admin/UsersTable";

export default function AdminUsersPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <UsersTable />
        </div>
      </div>
    </RequireRole>
  );
}

