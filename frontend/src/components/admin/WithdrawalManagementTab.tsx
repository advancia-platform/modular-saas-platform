"use client";

import React, { useState, useMemo } from "react";

const WithdrawalManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("request_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Mock withdrawal request data - replace with actual API calls to backend
  // All withdrawals MUST go through admin approval process
  const withdrawalRequests = useMemo(
    () => [
      {
        id: 1,
        userId: 2,
        userName: "Michael Chen",
        userEmail: "michael.chen@email.com",
        requestedAmount: 5890,
        requestedUSD: 5890.0,
        status: "pending", // pending -> admin reviews -> approved/declined
        requestDate: "2024-10-03",
        processedDate: null,
        adminNotes: "",
        userSpendingHistory: {
          totalSpent: 5890.0,
          totalOrders: 28,
          avgOrderValue: 210.36,
          lastPurchase: "2024-10-02",
          memberSince: "2024-08-22",
        },
        aiAnalysis: {
          riskScore: 0.2,
          recommendation: "APPROVE",
          reasoning: `User has consistent spending pattern with high order frequency. Account shows legitimate usage with no suspicious activity. Withdrawal amount matches earned balance from verified purchases.`,
          spendingPattern: "consistent",
          accountAge: 43,
          suspiciousActivity: false,
        },
      },
      {
        id: 2,
        userId: 1,
        userName: "Sarah Johnson",
        userEmail: "sarah.johnson@email.com",
        requestedAmount: 1200,
        requestedUSD: 1200.0,
        status: "approved",
        requestDate: "2024-10-01",
        processedDate: "2024-10-02",
        adminNotes: "Approved after verification of purchase history",
        userSpendingHistory: {
          totalSpent: 2450.0,
          totalOrders: 12,
          avgOrderValue: 204.17,
          lastPurchase: "2024-09-30",
          memberSince: "2024-09-15",
        },
        aiAnalysis: {
          riskScore: 0.1,
          recommendation: "APPROVE",
          reasoning: `Low-risk user with verified purchase history. Withdrawal amount is reasonable compared to total spending. No red flags detected.`,
          spendingPattern: "regular",
          accountAge: 18,
          suspiciousActivity: false,
        },
      },
      {
        id: 3,
        userId: 5,
        userName: "Lisa Wang",
        userEmail: "lisa.wang@email.com",
        requestedAmount: 150,
        requestedUSD: 150.0,
        status: "declined",
        requestDate: "2024-09-28",
        processedDate: "2024-09-29",
        adminNotes: "Insufficient account activity for withdrawal",
        userSpendingHistory: {
          totalSpent: 150.0,
          totalOrders: 1,
          avgOrderValue: 150.0,
          lastPurchase: "2024-09-15",
          memberSince: "2024-09-01",
        },
        aiAnalysis: {
          riskScore: 0.8,
          recommendation: "DECLINE",
          reasoning: `New account with minimal activity. Single purchase followed by immediate withdrawal request raises concerns. Recommend waiting for more established spending pattern.`,
          spendingPattern: "minimal",
          accountAge: 27,
          suspiciousActivity: true,
        },
      },
      {
        id: 4,
        userId: 6,
        userName: "Robert Davis",
        userEmail: "robert.davis@email.com",
        requestedAmount: 3200,
        requestedUSD: 3200.0,
        status: "pending",
        requestDate: "2024-10-04",
        processedDate: null,
        adminNotes: "",
        userSpendingHistory: {
          totalSpent: 3200.0,
          totalOrders: 8,
          avgOrderValue: 400.0,
          lastPurchase: "2024-10-03",
          memberSince: "2024-07-15",
        },
        aiAnalysis: {
          riskScore: 0.4,
          recommendation: "REVIEW",
          reasoning: `Moderate risk profile. User has legitimate purchase history but withdrawal timing shortly after large purchase requires manual review. Consider partial approval.`,
          spendingPattern: "irregular",
          accountAge: 81,
          suspiciousActivity: false,
        },
      },
      {
        id: 5,
        userId: 7,
        userName: "Jennifer Martinez",
        userEmail: "jennifer.martinez@email.com",
        requestedAmount: 890,
        requestedUSD: 890.0,
        status: "processing",
        requestDate: "2024-10-02",
        processedDate: null,
        adminNotes: "Payment processing initiated by admin",
        userSpendingHistory: {
          totalSpent: 1780.0,
          totalOrders: 6,
          avgOrderValue: 296.67,
          lastPurchase: "2024-09-25",
          memberSince: "2024-08-10",
        },
        aiAnalysis: {
          riskScore: 0.3,
          recommendation: "APPROVE",
          reasoning: `Established user with good spending history. Withdrawal amount is 50% of total spending, which is reasonable. No suspicious patterns detected.`,
          spendingPattern: "consistent",
          accountAge: 55,
          suspiciousActivity: false,
        },
      },
    ],
    []
  );

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending Admin Review" },
    { value: "processing", label: "Processing" },
    { value: "approved", label: "Approved" },
    { value: "declined", label: "Declined" },
  ];

  const sortOptions = [
    { value: "request_date", label: "Request Date" },
    { value: "requestedAmount", label: "Amount" },
    { value: "userName", label: "User Name" },
    { value: "status", label: "Status" },
  ];

  const filteredAndSortedRequests = useMemo(() => {
    const filtered = withdrawalRequests.filter((request) => {
      const matchesSearch =
        request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortBy as keyof typeof a] as
        | string
        | number;
      let bValue: string | number | Date = b[sortBy as keyof typeof b] as
        | string
        | number;

      if (sortBy === "request_date" || sortBy === "processedDate") {
        aValue = new Date(aValue as string);
        bValue = new Date(bValue as string);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [searchTerm, statusFilter, sortBy, sortOrder, withdrawalRequests]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Pending Admin Review",
      },
      processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      declined: { color: "bg-red-100 text-red-800", label: "Declined" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore <= 0.3) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Low Risk
        </span>
      );
    } else if (riskScore <= 0.6) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Medium Risk
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          High Risk
        </span>
      );
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    const config = {
      APPROVE: { color: "bg-green-100 text-green-800" },
      DECLINE: { color: "bg-red-100 text-red-800" },
      REVIEW: { color: "bg-yellow-100 text-yellow-800" },
    };

    const rec = config[recommendation as keyof typeof config] || config.REVIEW;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rec.color}`}
      >
        {recommendation}
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

  const handleApprove = (requestId: number) => {
    console.log(`[ADMIN ACTION] Approving withdrawal request ${requestId}`);
    // TODO: Implement API call to /api/admin/withdrawals/:id/approve
    // This requires admin authentication and authorization
  };

  const handleDecline = (requestId: number) => {
    console.log(`[ADMIN ACTION] Declining withdrawal request ${requestId}`);
    // TODO: Implement API call to /api/admin/withdrawals/:id/decline
    // This requires admin authentication and authorization
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Withdrawal Management
          </h2>
          <p className="text-gray-600">
            Review and process withdrawal requests (Admin approval required)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Requests
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <input
          type="search"
          placeholder="Search requests..."
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
                  Amount
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  AI Risk
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Recommendation
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Request Date
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRequests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        {getInitials(request.userName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.userName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.userEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-gray-900">
                      {request.requestedAmount.toLocaleString()}
                    </span>
                    <p className="text-xs text-gray-600">
                      ${request.requestedUSD.toLocaleString()}
                    </p>
                  </td>
                  <td className="p-4">{getStatusBadge(request.status)}</td>
                  <td className="p-4">
                    {getRiskBadge(request.aiAnalysis.riskScore)}
                  </td>
                  <td className="p-4">
                    {getRecommendationBadge(request.aiAnalysis.recommendation)}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        title="View details"
                      >
                        View
                      </button>
                      {request.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            title="Approve withdrawal"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecline(request.id)}
                            className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                            title="Decline withdrawal"
                          >
                            Decline
                          </button>
                        </>
                      )}
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
        {filteredAndSortedRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  {getInitials(request.userName)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {request.userName}
                  </p>
                  <p className="text-sm text-gray-600">{request.userEmail}</p>
                </div>
              </div>
              {getStatusBadge(request.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Requested Amount</p>
                <span className="font-mono text-sm text-gray-900">
                  {request.requestedAmount.toLocaleString()}
                </span>
                <p className="text-xs text-gray-600">
                  ${request.requestedUSD.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Request Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(request.requestDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {getRiskBadge(request.aiAnalysis.riskScore)}
              {getRecommendationBadge(request.aiAnalysis.recommendation)}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewDetails(request)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                View Details
              </button>
              {request.status === "pending" && (
                <>
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleDecline(request.id)}
                    className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    ✗
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Pending Admin Review</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {withdrawalRequests.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Approved</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {withdrawalRequests.filter((r) => r.status === "approved").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">Total Requested</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {withdrawalRequests
              .reduce((sum, r) => sum + r.requestedAmount, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">USD Value</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            $
            {withdrawalRequests
              .reduce((sum, r) => sum + r.requestedUSD, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Withdrawal Request Details
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xl">
                    {getInitials(selectedRequest.userName)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedRequest.userName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedRequest.userEmail}
                    </p>
                    <p className="text-xs text-gray-600">
                      Member since{" "}
                      {new Date(
                        selectedRequest.userSpendingHistory.memberSince
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      Requested Amount
                    </p>
                    <span className="text-xl font-semibold text-gray-900">
                      {selectedRequest.requestedAmount.toLocaleString()}
                    </span>
                    <p className="text-sm text-gray-600">
                      ${selectedRequest.requestedUSD.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {getStatusBadge(selectedRequest.status)}
                    <p className="text-sm text-gray-600 mt-1">
                      Requested on{" "}
                      {new Date(
                        selectedRequest.requestDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    AI Analysis
                  </h5>
                  <div className="flex gap-4 mb-3">
                    {getRiskBadge(selectedRequest.aiAnalysis.riskScore)}
                    {getRecommendationBadge(
                      selectedRequest.aiAnalysis.recommendation
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.aiAnalysis.reasoning}
                  </p>
                </div>

                {/* Spending History */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">
                    Spending History
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Spent</p>
                      <p className="font-mono text-gray-900">
                        $
                        {selectedRequest.userSpendingHistory.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Orders</p>
                      <p className="font-mono text-gray-900">
                        {selectedRequest.userSpendingHistory.totalOrders}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Order Value</p>
                      <p className="font-mono text-gray-900">
                        $
                        {selectedRequest.userSpendingHistory.avgOrderValue.toFixed(
                          2
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Last Purchase</p>
                      <p className="text-sm text-gray-900">
                        {new Date(
                          selectedRequest.userSpendingHistory.lastPurchase
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {selectedRequest.status === "pending" && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                        handleDecline(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Decline Request
                    </button>
                  </div>
                )}

                {selectedRequest.adminNotes && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Admin Notes
                    </p>
                    <p className="text-sm text-blue-800">
                      {selectedRequest.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagementTab;
