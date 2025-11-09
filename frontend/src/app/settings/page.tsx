"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SidebarLayout from "@/components/SidebarLayout";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  isActive: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  // Check if user is admin
  const userRole = sessionUser?.role || sessionUser?.email;
  const isAdmin = userRole === "admin" || 
                  sessionUser?.email === "admin@advancia.com" ||
                  sessionUser?.email?.includes("admin");

  useEffect(() => {
    // Only fetch users list if admin
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/users/users");
      const data = await response.json();
      // Ensure data is an array before setting
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/users/fund/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: newBalance }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh users list
        await fetchUsers();
        setEditingUser(null);
        setNewBalance(0);
        alert(data.message);
      } else {
        alert("Failed to update balance");
      }
    } catch (error) {
      console.error("Error updating balance:", error);
      alert("Error updating balance");
    }
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/users/update-role/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh users list
        await fetchUsers();
        setEditingRole(null);
        setNewRole('');
        alert(data.message);
      } else {
        alert("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Error updating role");
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user.id);
    setNewBalance(user.balance);
  };

  const startEditingRole = (user: User) => {
    setEditingRole(user.id);
    setNewRole(user.role);
  };

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">
              {isAdmin ? "Manage users and system settings" : "Manage your account settings"}
            </p>
          </div>

          {/* Regular User Settings */}
          {!isAdmin && (
            <div className="space-y-6">
              {/* Personal Settings Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Personal Settings</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={sessionUser?.name || ""}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={sessionUser?.email || ""}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Role</label>
                    <span className="px-3 py-2 inline-flex text-sm font-semibold rounded-lg bg-blue-100 text-blue-800 capitalize">
                      {sessionUser?.role || "User"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Preferences</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive updates about your transactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                      <p className="text-xs text-gray-500">Get notified about account security</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Account Information</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      For advanced account management, contact an administrator. Balance updates and role changes require admin privileges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin User Management */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">User Management</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRole === user.id ? (
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="bronze">Bronze</option>
                              <option value="silver">Silver</option>
                              <option value="gold">Gold</option>
                              <option value="platinum">Platinum</option>
                              <option value="diamond">Diamond</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user.id ? (
                            <input
                              type="number"
                              value={newBalance}
                              onChange={(e) => setNewBalance(Number(e.target.value))}
                              className="w-32 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              step="0.01"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-gray-900">
                              ${user.balance.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {editingUser === user.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateBalance(user.id)}
                                  className="text-green-600 hover:text-green-900 font-semibold"
                                >
                                  Save $
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUser(null);
                                    setNewBalance(0);
                                  }}
                                  className="text-gray-600 hover:text-gray-900 font-semibold"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : editingRole === user.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateRole(user.id)}
                                  className="text-green-600 hover:text-green-900 font-semibold"
                                >
                                  Save Role
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingRole(null);
                                    setNewRole('');
                                  }}
                                  className="text-gray-600 hover:text-gray-900 font-semibold"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(user)}
                                  className="text-blue-600 hover:text-blue-900 font-semibold"
                                >
                                  Edit $
                                </button>
                                <button
                                  onClick={() => startEditingRole(user)}
                                  className="text-purple-600 hover:text-purple-900 font-semibold"
                                >
                                  Role
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {loading ? "Loading users..." : "No users found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              )}

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Admin Access Required</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      You can edit user balances directly. Changes will be reflected immediately in the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
