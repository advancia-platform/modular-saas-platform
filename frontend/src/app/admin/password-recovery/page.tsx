"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Key, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

interface PasswordResetRequest {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  adminViewed: boolean;
  createdAt: string;
  ipAddress?: string;
}

interface UserDetails {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: string;
  lastLogin?: string;
  approved: boolean;
  active: boolean;
  role: string;
}

interface UserActivity {
  id: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  successful: boolean;
}

interface AdminNote {
  id: string;
  title: string;
  content: string;
  noteType: string;
  priority: string;
  createdAt: string;
  adminId: string;
}

export default function PasswordRecoveryAdmin() {
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userNotes, setUserNotes] = useState<AdminNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "search">("requests");

  // New password form
  const [newPassword, setNewPassword] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  
  // Note form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notePriority, setNotePriority] = useState("normal");

  useEffect(() => {
    fetchResetRequests();
  }, []);

  const fetchResetRequests = async (status = "pending") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/password-recovery/admin/requests?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setResetRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch reset requests:", error);
    }
    setLoading(false);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/password-recovery/admin/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    }
    setLoading(false);
  };

  const viewUserDetails = async (userId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/password-recovery/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUser(data.user);
        setUserActivities(data.activities);
        setUserNotes(data.notes);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
    setLoading(false);
  };

  const resetUserPassword = async () => {
    if (!resetUserId || !newPassword) {
      alert("Please enter user ID and new password");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (!confirm(`Reset password for user ${resetUserId}? The new password will be: ${newPassword}`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/password-recovery/admin/reset-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: resetUserId, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}\n\nNew Password: ${newPassword}\n\nMake sure to save this password!`);
        setNewPassword("");
        setResetUserId("");
        if (selectedUser) {
          viewUserDetails(selectedUser.id);
        }
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Failed to reset password");
    }
  };

  const addUserNote = async () => {
    if (!selectedUser || !noteTitle || !noteContent) {
      alert("Please fill in title and content");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/password-recovery/admin/add-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          title: noteTitle,
          content: noteContent,
          priority: notePriority,
          noteType: "password_recovery",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Note added successfully");
        setNoteTitle("");
        setNoteContent("");
        viewUserDetails(selectedUser.id);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to add note:", error);
      alert("Failed to add note");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🔐 Password Recovery & User Management
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "requests"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Clock className="inline mr-2" size={20} />
            Reset Requests
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === "search"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Search className="inline mr-2" size={20} />
            Search Users
          </button>
        </div>

        {/* Reset Requests Tab */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => fetchResetRequests("pending")}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Pending
              </button>
              <button
                onClick={() => fetchResetRequests("used")}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Used
              </button>
              <button
                onClick={() => fetchResetRequests("expired")}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Expired
              </button>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Token</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Expires</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resetRequests.map((req) => (
                      <tr key={req.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{req.email}</td>
                        <td className="p-3 font-mono text-sm">{req.token.substring(0, 20)}...</td>
                        <td className="p-3">{new Date(req.createdAt).toLocaleString()}</td>
                        <td className="p-3">{new Date(req.expiresAt).toLocaleString()}</td>
                        <td className="p-3">
                          {req.used ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle size={16} className="mr-1" /> Used
                            </span>
                          ) : new Date(req.expiresAt) < new Date() ? (
                            <span className="text-red-600 flex items-center">
                              <XCircle size={16} className="mr-1" /> Expired
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center">
                              <Clock size={16} className="mr-1" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => viewUserDetails(req.userId)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Search Users Tab */}
        {activeTab === "search" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Search by email, username, name, or phone..."
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                onClick={searchUsers}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="inline mr-2" size={20} />
                Search
              </button>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-500">Searching...</p>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                    onClick={() => viewUserDetails(user.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">
                          {user.firstName} {user.lastName} (@{user.username})
                        </h3>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">Phone: {user.phoneNumber || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">Role: {user.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h2>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Reset Password Section */}
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-bold mb-3 flex items-center">
                    <Key className="mr-2" size={20} />
                    Reset User Password
                  </h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="flex-1 px-4 py-2 border rounded"
                    />
                    <button
                      onClick={() => {
                        setResetUserId(selectedUser.id);
                        resetUserPassword();
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                {/* Add Note Section */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold mb-3 flex items-center">
                    <FileText className="mr-2" size={20} />
                    Add Admin Note
                  </h3>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title"
                    className="w-full px-4 py-2 border rounded mb-2"
                  />
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Note content..."
                    className="w-full px-4 py-2 border rounded mb-2"
                    rows={3}
                  />
                  <div className="flex gap-4">
                    <select
                      value={notePriority}
                      onChange={(e) => setNotePriority(e.target.value)}
                      className="px-4 py-2 border rounded"
                    >
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <button
                      onClick={addUserNote}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* User Activity */}
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Recent Activity</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userActivities.map((activity) => (
                      <div key={activity.id} className="p-3 bg-gray-50 rounded flex justify-between">
                        <div>
                          <span className="font-medium">{activity.action}</span>
                          {activity.ipAddress && (
                            <span className="text-sm text-gray-500 ml-2">({activity.ipAddress})</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="font-bold mb-3">Admin Notes</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{note.title}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                            note.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : note.priority === "normal"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {note.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
