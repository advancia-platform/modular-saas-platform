"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import adminApi from "@/lib/adminApi";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  status: string;
  verified: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface UserProfileCardProps {
  profile: UserProfile;
  onUpdate?: () => void;
}

export default function UserProfileCard({
  profile,
  onUpdate,
}: UserProfileCardProps) {
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === profile.role) return;
    setIsUpdatingRole(true);
    try {
      await adminApi.patch(`/api/admin/users/${profile.id}/role`, {
        role: newRole,
      });
      toast.success(`Role updated to ${newRole}`);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">User Profile</h2>
      </div>
      <div className="p-6 space-y-4">
        {/* Name and Verified Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
          </div>
          {profile.verified && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Verified
            </span>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Email
          </label>
          <p className="text-gray-900">{profile.email}</p>
        </div>

        {/* Role Switcher */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">
            Role
          </label>
          <div className="flex gap-2">
            {["USER", "STAFF", "ADMIN"].map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                disabled={isUpdatingRole}
                aria-label={`Set role to ${role}`}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  profile.role === role
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${
                  isUpdatingRole
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              profile.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {profile.status}
          </span>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Joined
            </label>
            <p className="text-gray-900 text-sm">
              {formatDate(profile.createdAt)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Last Login
            </label>
            <p className="text-gray-900 text-sm">
              {formatDate(profile.lastLogin)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
