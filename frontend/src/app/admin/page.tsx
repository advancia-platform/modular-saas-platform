"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  Shield,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Eye,
  Ban,
  Settings,
  Database,
  Server,
  BarChart3,
  UserCheck,
  UserX,
  Zap,
  Globe,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Mail,
  Bell,
  FileText,
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import AdminNotifyLite from "@/components/AdminNotifyLite";
import RecentBulkCredits from "@/components/RecentBulkCredits";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Mock data for charts
const transactionData = [
  { name: "Mon", transactions: 245, revenue: 12500 },
  { name: "Tue", transactions: 310, revenue: 15800 },
  { name: "Wed", transactions: 289, revenue: 14200 },
  { name: "Thu", transactions: 412, revenue: 19600 },
  { name: "Fri", transactions: 387, revenue: 21300 },
  { name: "Sat", transactions: 298, revenue: 16700 },
  { name: "Sun", transactions: 243, revenue: 13400 },
];

const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 145 },
  { month: "Mar", users: 178 },
  { month: "Apr", users: 210 },
  { month: "May", users: 245 },
  { month: "Jun", users: 289 },
];

const statusDistribution = [
  { name: "Active", value: 75 },
  { name: "Inactive", value: 15 },
  { name: "Suspended", value: 7 },
  { name: "Pending", value: 3 },
];

const revenueByCategory = [
  { category: "Transactions", amount: 45000, percentage: 42 },
  { category: "Subscriptions", amount: 28000, percentage: 26 },
  { category: "Crypto Trading", amount: 21000, percentage: 20 },
  { category: "Card Fees", amount: 13000, percentage: 12 },
];

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as SessionUser | undefined;
  
  const [selectedTab, setSelectedTab] = useState<"overview" | "analytics" | "users" | "system">("overview");
  const [realTimeStats, setRealTimeStats] = useState({
    activeUsers: 127,
    todayTransactions: 1847,
    todayRevenue: 94235,
    serverLoad: 34,
    responseTime: 145,
    errorRate: 0.2,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        todayTransactions: prev.todayTransactions + Math.floor(Math.random() * 3),
        todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 500),
        serverLoad: Math.max(10, Math.min(90, prev.serverLoad + Math.floor(Math.random() * 10) - 5)),
        responseTime: Math.max(80, Math.min(300, prev.responseTime + Math.floor(Math.random() * 20) - 10)),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() * 0.2 - 0.1))),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/");
      return;
    }

    const userRole = sessionUser?.role || sessionUser?.email;
    const isAdmin = userRole === "admin" || 
                    sessionUser?.email === "admin@advancia.com" ||
                    sessionUser?.email?.includes("admin");

    if (!isAdmin) {
      alert("⛔ Access Denied: Admin privileges required");
      router.push("/");
      return;
    }
  }, [session, status, router, sessionUser]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Dashboard", icon: BarChart3 },
    { id: "analytics" as const, label: "Analytics", icon: TrendingUp },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "system" as const, label: "System", icon: Server },
  ];

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <Shield className="text-white" size={40} />
                </div>
                <div>
                  <h1 className="text-5xl font-bold text-white mb-2">Admin Command Center</h1>
                  <p className="text-purple-300 text-lg flex items-center gap-2">
                    <Zap size={18} className="text-yellow-400" />
                    Live monitoring • {sessionUser?.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  System Online
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mb-8 overflow-x-auto pb-2"
          >
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedTab === tab.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {selectedTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Real-time Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Users size={32} className="text-white/80" />
                        <Activity size={24} className="text-white/60 animate-pulse" />
                      </div>
                      <p className="text-white/90 text-sm mb-1">Active Users Now</p>
                      <p className="text-5xl font-bold text-white mb-2">
                        <CountUp end={realTimeStats.activeUsers} duration={1} />
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <ArrowUpRight size={16} />
                        <span>+12% from yesterday</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Activity size={32} className="text-white/80" />
                        <TrendingUp size={24} className="text-white/60" />
                      </div>
                      <p className="text-white/90 text-sm mb-1">Today's Transactions</p>
                      <p className="text-5xl font-bold text-white mb-2">
                        <CountUp end={realTimeStats.todayTransactions} duration={1} separator="," />
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <ArrowUpRight size={16} />
                        <span>+8.3% from average</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <DollarSign size={32} className="text-white/80" />
                        <Wallet size={24} className="text-white/60" />
                      </div>
                      <p className="text-white/90 text-sm mb-1">Today's Revenue</p>
                      <p className="text-4xl font-bold text-white mb-2">
                        $<CountUp end={realTimeStats.todayRevenue} duration={1} separator="," />
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <ArrowUpRight size={16} />
                        <span>+15.2% vs yesterday</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Server size={32} className="text-white/80" />
                        <Zap size={24} className="text-white/60 animate-pulse" />
                      </div>
                      <p className="text-white/90 text-sm mb-1">Server Load</p>
                      <p className="text-5xl font-bold text-white mb-2">
                        <CountUp end={realTimeStats.serverLoad} duration={1} />%
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Clock size={16} />
                        <span>{realTimeStats.responseTime}ms avg response</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transaction Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 size={24} className="text-purple-400" />
                        Weekly Transactions
                      </h3>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-semibold">
                        Last 7 Days
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={transactionData}>
                        <defs>
                          <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #6366f1', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="transactions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTrans)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Revenue Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign size={24} className="text-green-400" />
                        Revenue Trend
                      </h3>
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm font-semibold">
                        $107,500 Total
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={transactionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #10b981', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Growth */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Users size={20} className="text-blue-400" />
                      User Growth
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #3b82f6', borderRadius: '8px' }}
                        />
                        <Bar dataKey="users" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Status Distribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Activity size={20} className="text-purple-400" />
                      User Status
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Revenue by Category */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl"
                  >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-green-400" />
                      Revenue Sources
                    </h3>
                    <div className="space-y-3">
                      {revenueByCategory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white text-sm font-semibold">{item.category}</span>
                              <span className="text-purple-300 text-sm">${(item.amount / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                                className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Admin Components */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <AdminNotifyLite />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <RecentBulkCredits limit={5} />
                  </motion.div>
                </div>

                {/* System Health */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl"
                >
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Server size={24} className="text-cyan-400" />
                    System Health Monitor
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Response Time</span>
                        <Clock className="text-green-400" size={18} />
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">
                        <CountUp end={realTimeStats.responseTime} duration={1} />ms
                      </p>
                      <p className="text-green-400 text-xs font-semibold">Excellent</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Error Rate</span>
                        <AlertCircle className="text-blue-400" size={18} />
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">
                        <CountUp end={realTimeStats.errorRate} decimals={2} duration={1} />%
                      </p>
                      <p className="text-blue-400 text-xs font-semibold">Very Low</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Uptime</span>
                        <CheckCircle className="text-purple-400" size={18} />
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">99.9%</p>
                      <p className="text-purple-400 text-xs font-semibold">30 Days</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Active Sessions</span>
                        <Globe className="text-cyan-400" size={18} />
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">
                        <CountUp end={realTimeStats.activeUsers} duration={1} />
                      </p>
                      <p className="text-cyan-400 text-xs font-semibold">Live Now</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {selectedTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl"
              >
                <h2 className="text-3xl font-bold text-white mb-4">Advanced Analytics</h2>
                <p className="text-gray-300 mb-6">Detailed insights and performance metrics coming soon...</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/30">
                    <FileText className="text-blue-400 mb-3" size={32} />
                    <h3 className="text-white font-semibold mb-2">Reports</h3>
                    <p className="text-gray-400 text-sm">Generate custom reports</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30">
                    <BarChart3 className="text-green-400 mb-3" size={32} />
                    <h3 className="text-white font-semibold mb-2">Metrics</h3>
                    <p className="text-gray-400 text-sm">Track key performance indicators</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/30">
                    <Activity className="text-purple-400 mb-3" size={32} />
                    <h3 className="text-white font-semibold mb-2">Insights</h3>
                    <p className="text-gray-400 text-sm">AI-powered analytics</p>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl"
              >
                <h2 className="text-3xl font-bold text-white mb-6">User Management</h2>
                <p className="text-gray-300">User management interface - manage accounts, permissions, and access levels.</p>
              </motion.div>
            )}

            {selectedTab === "system" && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl"
              >
                <h2 className="text-3xl font-bold text-white mb-6">System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-lg">Frontend Server</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-semibold">Online</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">Port: 3000</p>
                    <p className="text-gray-400 text-sm">Status: Healthy</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-lg">Backend Server</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-semibold">Online</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">Port: 4000</p>
                    <p className="text-gray-400 text-sm">Status: Healthy</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-lg">Database</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-semibold">Connected</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">PostgreSQL 14</p>
                    <p className="text-gray-400 text-sm">Port: 5432</p>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-lg">Redis Cache</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-semibold">Active</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">Port: 6379</p>
                    <p className="text-gray-400 text-sm">Memory: 234 MB</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SidebarLayout>
  );
}
