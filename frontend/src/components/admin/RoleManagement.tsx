'use client';

import { adminApi } from '@/lib/api';
import React, { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'STAFF' | 'ADMIN' | 'SUPERADMIN';
  active: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  value: string;
  label: string;
  description: string;
  permissions: string[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const RoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, roleFilter, statusFilter]);

  const fetchRoles = async () => {
    try {
      const response = await adminApi.get('/roles');
      if (response.data.success) {
        setRoles(response.data.roles);
      }
    } catch (err: any) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await adminApi.get(`/users?${params}`);

      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      const response = await adminApi.put(`/users/${userId}/role`, { role: newRole });

      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user.id === userId
              ? { ...user, role: newRole as any, updatedAt: response.data.user.updatedAt }
              : user
          )
        );
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const updateUserStatus = async (userId: string, active: boolean) => {
    try {
      setUpdating(userId);
      const response = await adminApi.put(`/users/${userId}/status`, { active });

      if (response.data.success) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, active, updatedAt: response.data.user.updatedAt } : user
          )
        );
        setError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user status');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (active: boolean) => {
    return active
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage user roles and permissions across the system
            </p>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <input
                    type="text"
                    placeholder="Search by email, username, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No users found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : user.username}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(user.active)}`}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                        {user.emailVerified && (
                          <span className="ml-1 inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800 border border-green-200">
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          disabled={updating === user.id}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => updateUserStatus(user.id, !user.active)}
                          disabled={updating === user.id}
                          className={`px-3 py-1 rounded-md text-white text-xs font-medium focus:outline-none focus:ring-2 disabled:opacity-50 ${
                            user.active
                              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          {updating === user.id ? '...' : user.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPagination({ ...pagination, page: i + 1 })}
                    className={`px-3 py-1 border rounded-md text-sm ${
                      pagination.page === i + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Role Descriptions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role Descriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <div key={role.value} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border mb-2 ${getRoleBadgeColor(role.value)}`}
                  >
                    {role.label}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                  <div className="text-xs text-gray-500">
                    <strong>Permissions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {role.permissions.includes('*') ? (
                        <li>Full system access</li>
                      ) : (
                        role.permissions
                          .slice(0, 3)
                          .map((permission, index) => (
                            <li key={index}>{permission.replace('_', ' ')}</li>
                          ))
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
