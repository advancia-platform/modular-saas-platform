"use client";

import React, { useState, useMemo } from "react";

const UserManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("registration_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mock user data - replace with actual API calls
  const users = useMemo(
    () => [
      {
        id: 1,
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        status: "active",
        role: "user",
        registrationDate: "2024-09-15",
        totalSpent: 2450.0,
        balanceCoins: 2450,
        lastLogin: "2024-10-03",
        totalOrders: 12,
        badges: ["Bronze Spender", "Early Adopter"],
      },
      {
        id: 2,
        name: "Michael Chen",
        email: "michael.chen@email.com",
        status: "active",
        role: "user",
        registrationDate: "2024-08-22",
        totalSpent: 5890.0,
        balanceCoins: 5890,
        lastLogin: "2024-10-04",
        totalOrders: 28,
        badges: ["Silver Spender", "Frequent Buyer", "VIP Member"],
      },
      {
        id: 3,
        name: "Emily Rodriguez",
        email: "emily.rodriguez@email.com",
        status: "suspended",
        role: "user",
        registrationDate: "2024-07-10",
        totalSpent: 890.0,
        balanceCoins: 890,
        lastLogin: "2024-09-28",
        totalOrders: 5,
        badges: ["Bronze Spender"],
      },
      {
        id: 4,
        name: "David Thompson",
        email: "david.thompson@email.com",
        status: "active",
        role: "admin",
        registrationDate: "2024-06-01",
        totalSpent: 12450.0,
        balanceCoins: 12450,
        lastLogin: "2024-10-04",
        totalOrders: 45,
        badges: ["Gold Spender", "Admin", "Platform Pioneer"],
      },
      {
        id: 5,
        name: "Lisa Wang",
        email: "lisa.wang@email.com",
        status: "inactive",
        role: "user",
        registrationDate: "2024-09-01",
        totalSpent: 150.0,
        balanceCoins: 150,
        lastLogin: "2024-09-15",
        totalOrders: 1,
        badges: [],
      },
    ],
    []
  );

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  const sortOptions = [
    { value: "registration_date", label: "Registration Date" },
    { value: "name", label: "Name" },
    { value: "totalSpent", label: "Total Spent" },
    { value: "lastLogin", label: "Last Login" },
  ];

  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortBy as keyof typeof a] as
        | string
        | number;
      let bValue: string | number | Date = b[sortBy as keyof typeof b] as
        | string
        | number;

      if (sortBy === "registration_date" || sortBy === "lastLogin") {
        aValue = new Date(aValue as string);
        bValue = new Date(bValue as string);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [searchTerm, statusFilter, sortBy, sortOrder, users]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
      suspended: { color: "bg-red-100 text-red-800", label: "Suspended" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Admin
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        User
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleStatusChange = (userId: number, newStatus: string) => {
    console.log(`Changing user ${userId} status to ${newStatus}`);
    // TODO: Implement API call to update user status
  };

  const handleDeleteUser = (userId: number) => {
    console.log(`Deleting user ${userId}`);
    // TODO: Implement API call to delete user
  };

  const handleEditUser = (userId: number) => {
    console.log(`Editing user ${userId}`);
    // TODO: Implement edit user modal
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            User Management
          </h2>
          <p className="text-gray-600">
            Manage user accounts, permissions, and status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Users
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <input
          type="search"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filter by status"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort by field"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">
                  User
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Role
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Registration
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Total Spent
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Balance
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Orders
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Last Login
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(user.status)}</td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-mono text-sm text-gray-900">
                    ${user.totalSpent.toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-sm text-gray-900">
                    {user.balanceCoins.toLocaleString()}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {user.totalOrders}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        title="Edit user"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            user.id,
                            user.status === "suspended" ? "active" : "suspended"
                          )
                        }
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        title={
                          user.status === "suspended"
                            ? "Activate user"
                            : "Suspend user"
                        }
                      >
                        {user.status === "suspended" ? "Activate" : "Suspend"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                        title="Delete user"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredAndSortedUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(user.status)}
                {getRoleBadge(user.role)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Total Spent</p>
                <p className="font-mono text-sm text-gray-900">
                  ${user.totalSpent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Balance</p>
                <p className="font-mono text-sm text-gray-900">
                  {user.balanceCoins.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Orders</p>
                <p className="text-sm text-gray-900">{user.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Last Login</p>
                <p className="text-sm text-gray-900">
                  {new Date(user.lastLogin).toLocaleDateString()}
                </p>
              </div>
            </div>

            {user.badges.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Badges</p>
                <div className="flex flex-wrap gap-1">
                  {user.badges.map((badge, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEditUser(user.id)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  handleStatusChange(
                    user.id,
                    user.status === "suspended" ? "active" : "suspended"
                  )
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {user.status === "suspended" ? "Activate" : "Suspend"}
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Users</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Active Users</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Revenue</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            $
            {users
              .reduce((sum, user) => sum + user.totalSpent, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Balance</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {users
              .reduce((sum, user) => sum + user.balanceCoins, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTab;
