"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Lock,
  Ban,
  Database,
  UserCheck,
  Bell,
  Phone,
  Menu,
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as SessionUser | undefined;
  const [loading, setLoading] = useState(true);

  // Initialize stats
  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    const userRole = sessionUser?.role || sessionUser?.email;
    const isAdmin =
      userRole === "admin" ||
      sessionUser?.email === "admin@advancia.com" ||
      sessionUser?.email?.includes("admin");

    if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [session, status, router, sessionUser]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
            <p className="text-sm font-medium">Loading admin dashboard...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/10 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <button
              aria-label="Toggle menu"
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-red-500" size={40} />
              <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <p className="text-slate-300">
              System Overview - {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-6 w-6 opacity-80" />
                <h3 className="font-semibold">Users</h3>
              </div>
              <p className="text-3xl font-bold mb-2">1,247</p>
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4" />
                <span>892 active</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-400 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="h-6 w-6 opacity-80" />
                <h3 className="font-semibold">Transactions</h3>
              </div>
              <p className="text-3xl font-bold mb-2">15,680</p>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                <span>$2,456,789</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Phone className="h-6 w-6 opacity-80" />
                <h3 className="font-semibold">SMS Auth</h3>
              </div>
              <p className="text-3xl font-bold mb-2">678</p>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>89 failed attempts</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-400 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="h-6 w-6 opacity-80" />
                <h3 className="font-semibold">Alerts</h3>
              </div>
              <p className="text-3xl font-bold mb-2">45</p>
              <div className="flex items-center gap-2 text-sm">
                <Ban className="h-4 w-4" />
                <span>23 suspended</span>
              </div>
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 text-white">
              <Database className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Database</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">API Response</span>
                  <span className="text-green-400">243ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Memory Usage</span>
                  <span className="text-green-400">67%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 text-white">
              <Shield className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Security Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">SSL Certificate</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <Lock className="h-4 w-4" />
                    Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Last Backup</span>
                  <span className="text-green-400">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Active Sessions</span>
                  <span className="text-blue-400">126</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Recent Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="pb-3 text-slate-300 font-medium">Event</th>
                    <th className="pb-3 text-slate-300 font-medium">User</th>
                    <th className="pb-3 text-slate-300 font-medium">Time</th>
                    <th className="pb-3 text-slate-300 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3">Admin Login</td>
                    <td>admin@advancia.com</td>
                    <td>2 mins ago</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Success
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3">SMS Verification</td>
                    <td>+1 (555) 123-4567</td>
                    <td>15 mins ago</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-yellow-400">
                        <AlertCircle className="h-4 w-4" />
                        Pending
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">System Backup</td>
                    <td>system</td>
                    <td>1 hour ago</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
