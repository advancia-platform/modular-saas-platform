"use client";

import { useState, useEffect } from "react";
import ApprovalCheck from "@/components/ApprovalCheck";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";
import BalanceOverview from "@/components/BalanceOverview";
import QuickActions from "@/components/QuickActions";
import RecentTransactions from "@/components/RecentTransactions";

function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  useEffect(() => {
    fetchUserInfo();
    fetchPendingItems();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.firstName || data.username || "User");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchPendingItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // Fetch pending orders
      const ordersResponse = await fetch(`/api/crypto/orders/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        const pending = orders.filter((o: { status: string }) => o.status === "PENDING").length;
        setPendingOrders(pending);
      }

      // Fetch pending withdrawals
      const withdrawalsResponse = await fetch(`/api/crypto/withdrawals/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (withdrawalsResponse.ok) {
        const withdrawals = await withdrawalsResponse.json();
        const pending = withdrawals.filter((w: { status: string }) => w.status === "PENDING").length;
        setPendingWithdrawals(pending);
      }
    } catch (error) {
      console.error("Error fetching pending items:", error);
    }
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Banner */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {getCurrentGreeting()}, {userName}! 👋
            </h1>
            <p className="text-gray-300">
              Welcome to your dashboard. Here&apos;s an overview of your account.
            </p>
          </div>

          {/* Pending Alerts */}
          {(pendingOrders > 0 || pendingWithdrawals > 0) && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrders > 0 && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-yellow-300">
                        Pending Crypto Orders
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        You have {pendingOrders} crypto purchase {pendingOrders === 1 ? "order" : "orders"} awaiting
                        admin approval.
                      </p>
                      <a
                        href="/crypto/orders"
                        className="text-sm font-medium text-yellow-400 hover:text-yellow-300 mt-2 inline-block transition"
                      >
                        View Orders →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {pendingWithdrawals > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-blue-300">
                        Pending Withdrawals
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        You have {pendingWithdrawals} withdrawal {pendingWithdrawals === 1 ? "request" : "requests"} being processed.
                      </p>
                      <a
                        href="/crypto/withdrawals"
                        className="text-sm font-medium text-blue-400 hover:text-blue-300 mt-2 inline-block transition"
                      >
                        View Withdrawals →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Balance Overview */}
          <div className="mb-8">
            <BalanceOverview />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActions />
          </div>

          {/* Recent Transactions */}
          <div className="mb-8">
            <RecentTransactions />
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-300 mb-4">
                  If you have questions about crypto trading, withdrawals, or your account, our support team is here
                  to help.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/support"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Contact Support
                  </a>
                  <a
                    href="/faq"
                    className="inline-flex items-center px-4 py-2 border border-purple-500/50 text-gray-200 hover:bg-purple-500/10 rounded-lg transition"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    View FAQ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}

// Wrap with ApprovalCheck to redirect unapproved users
function DashboardWithApproval() {
  return (
    <ApprovalCheck>
      <DashboardPage />
    </ApprovalCheck>
  );
}

export default DashboardWithApproval;
