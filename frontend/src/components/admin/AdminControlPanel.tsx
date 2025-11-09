"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserManagementTab from "./UserManagementTab";
import ProductManagementTab from "./ProductManagementTab";
import WithdrawalManagementTab from "./WithdrawalManagementTab";
// import AnalyticsTab from "./AnalyticsTab";

const AdminControlPanel = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeUsers: 0,
    pendingWithdrawals: 0,
    activeProducts: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Fetch current user from API
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/enhanced");
          return;
        }

        const response = await fetch("http://localhost:4000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          router.push("/auth/enhanced");
          return;
        }

        const data = await response.json();

        // Check if user is admin
        if (data.user?.role !== "ADMIN") {
          router.push("/");
          return;
        }

        setCurrentUser(data.user);
        await fetchStats();
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/auth/enhanced");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch dashboard stats from your backend
      const response = await fetch("http://localhost:4000/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const tabs = [
    {
      id: "users",
      label: "User Management",
      icon: "👥",
      description: "Manage user accounts and permissions",
      component: UserManagementTab,
    },
    {
      id: "products",
      label: "Product Management",
      icon: "📦",
      description: "Manage services and catalog",
      component: ProductManagementTab,
    },
    {
      id: "withdrawals",
      label: "Withdrawal Requests",
      icon: "💳",
      description: "Review and process withdrawal requests",
      component: WithdrawalManagementTab,
    },
    
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  const getInitials = (name: string) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Control Panel
                </h1>
                <p className="text-sm text-gray-600">
                  Platform management and administration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                  {getInitials(currentUser?.username || currentUser?.email)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.username || currentUser?.email}
                  </p>
                  <p className="text-xs text-gray-600">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-4">
                Administration
              </h2>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tab.label}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          activeTab === tab.id
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {tab.description}
                      </p>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.activeUsers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Pending Withdrawals
                  </span>
                  <span className="text-sm font-medium text-yellow-600">
                    {stats.pendingWithdrawals}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Services</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.activeProducts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-sm font-medium text-green-600">
                    ${stats.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {ActiveComponent ? (
                <ActiveComponent />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Access Denied
                  </h3>
                  <p className="text-gray-600">
                    You don't have permission to access this section.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 min-w-0 ${
                activeTab === tab.id
                  ? "text-blue-600 border-t-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminControlPanel;
