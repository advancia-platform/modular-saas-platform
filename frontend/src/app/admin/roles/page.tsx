'use client';

import AdminNav from '@/components/AdminNav';
import RoleManagement from '@/components/admin/RoleManagement';

export default function AdminRoleManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminNav />
      <RoleManagement />
    </div>
  );
}
