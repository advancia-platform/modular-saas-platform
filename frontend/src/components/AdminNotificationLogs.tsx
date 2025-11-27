import React, { useEffect, useState } from "react";
import "./NotificationLogs.css";

interface NotificationLog {
  id: string;
  userId: string;
  email: string;
  subject: string;
  message: string;
  template?: string;
  provider: string;
  status: string;
  sentAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

interface FilterState {
  email: string;
  subject: string;
  startDate: string;
  endDate: string;
  userId: string;
  provider: string;
  status: string;
}

interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const NotificationLogs: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    email: "",
    subject: "",
    startDate: "",
    endDate: "",
    userId: "",
    provider: "",
    status: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch logs from API
  const fetchLogs = async (resetOffset = true) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
        limit: pagination.limit.toString(),
        offset: resetOffset ? "0" : pagination.offset.toString(),
      });

      const response = await fetch(`/api/admin/notification-logs?${query}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        if (resetOffset) {
          setLogs(data.data.logs);
          setPagination({ ...data.data.pagination, limit: pagination.limit });
        } else {
          setLogs((prev) => [...prev, ...data.data.logs]);
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error("Failed to fetch logs");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      console.error("Error fetching notification logs:", err);
    } finally {\n      setLoading(false);\n    }\n  };\n\n  // Load more logs (pagination)\n  const loadMore = () => {\n    if (!loading && pagination.hasMore) {\n      setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));\n      fetchLogs(false);\n    }\n  };\n\n  // Apply filters\n  const applyFilters = () => {\n    fetchLogs(true);\n  };\n\n  // Clear filters\n  const clearFilters = () => {\n    setFilters({\n      email: \"\",\n      subject: \"\",\n      startDate: \"\",\n      endDate: \"\",\n      userId: \"\",\n      provider: \"\",\n      status: \"\",\n    });\n  };\n\n  // Export to CSV\n  const exportLogs = async () => {\n    try {\n      const query = new URLSearchParams(\n        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== \"\"))\n      );\n\n      const response = await fetch(`/api/admin/notification-logs/export?${query}`, {\n        headers: {\n          \"Authorization\": `Bearer ${localStorage.getItem(\"token\")}`,\n        },\n      });\n\n      if (!response.ok) {\n        throw new Error(`Export failed: ${response.statusText}`);\n      }\n\n      // Download the CSV file\n      const blob = await response.blob();\n      const url = window.URL.createObjectURL(blob);\n      const link = document.createElement(\"a\");\n      link.href = url;\n      link.download = `notification_logs_${new Date().toISOString().split('T')[0]}.csv`;\n      document.body.appendChild(link);\n      link.click();\n      document.body.removeChild(link);\n      window.URL.revokeObjectURL(url);\n    } catch (err) {\n      const errorMsg = err instanceof Error ? err.message : \"Export failed\";\n      setError(errorMsg);\n    }\n  };\n\n  // Initialize\n  useEffect(() => {\n    fetchLogs();\n  }, []);\n\n  // Update when pagination offset changes (for load more)\n  useEffect(() => {\n    if (pagination.offset > 0) {\n      fetchLogs(false);\n    }\n  }, [pagination.offset]);\n\n  const formatDate = (dateString: string) => {\n    return new Date(dateString).toLocaleString();\n  };\n\n  const truncateText = (text: string, maxLength = 100) => {\n    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;\n  };\n\n  const getStatusBadge = (status: string) => {\n    const className = status === \"sent\" ? \"status-success\" : \"status-error\";\n    return <span className={`status-badge ${className}`}>{status}</span>;\n  };\n\n  const getProviderBadge = (provider: string) => {\n    return <span className=\"provider-badge\">{provider}</span>;\n  };\n\n  return (\n    <div className=\"notification-logs\">\n      <div className=\"page-header\">\n        <h2>📧 Notification Logs</h2>\n        <p className=\"page-description\">\n          Monitor and audit all emails sent by the system for compliance and debugging.\n        </p>\n      </div>\n\n      {/* Controls */}\n      <div className=\"controls\">\n        <button\n          className=\"btn btn-secondary\"\n          onClick={() => setShowFilters(!showFilters)}\n        >\n          {showFilters ? \"Hide Filters\" : \"Show Filters\"} 🔍\n        </button>\n        <button className=\"btn btn-primary\" onClick={() => fetchLogs(true)} disabled={loading}>\n          {loading ? \"Loading...\" : \"Refresh\"} 🔄\n        </button>\n        <button className=\"btn btn-success\" onClick={exportLogs} disabled={loading}>\n          Export CSV 📥\n        </button>\n      </div>\n\n      {/* Filters */}\n      {showFilters && (\n        <div className=\"filters\">\n          <div className=\"filter-grid\">\n            <div className=\"filter-group\">\n              <label>Email:</label>\n              <input\n                type=\"text\"\n                placeholder=\"Filter by email address\"\n                value={filters.email}\n                onChange={(e) => setFilters({ ...filters, email: e.target.value })}\n              />\n            </div>\n\n            <div className=\"filter-group\">\n              <label>Subject:</label>\n              <input\n                type=\"text\"\n                placeholder=\"Filter by email subject\"\n                value={filters.subject}\n                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}\n              />\n            </div>\n\n            <div className=\"filter-group\">\n              <label>User ID:</label>\n              <input\n                type=\"text\"\n                placeholder=\"Filter by user ID\"\n                value={filters.userId}\n                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}\n              />\n            </div>\n\n            <div className=\"filter-group\">\n              <label>Provider:</label>\n              <select\n                value={filters.provider}\n                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}\n              >\n                <option value=\"\">All Providers</option>\n                <option value=\"gmail\">Gmail</option>\n                <option value=\"resend\">Resend</option>\n                <option value=\"sendgrid\">SendGrid</option>\n              </select>\n            </div>\n\n            <div className=\"filter-group\">\n              <label>Status:</label>\n              <select\n                value={filters.status}\n                onChange={(e) => setFilters({ ...filters, status: e.target.value })}\n              >\n                <option value=\"\">All Status</option>\n                <option value=\"sent\">Sent</option>\n                <option value=\"failed\">Failed</option>\n              </select>\n            </div>\n\n            <div className=\"filter-group\">\n              <label>Start Date:</label>\n              <input\n                type=\"date\"\n                value={filters.startDate}\n                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}\n              />\n            </div>\n\n            <div className=\"filter-group\">\n              <label>End Date:</label>\n              <input\n                type=\"date\"\n                value={filters.endDate}\n                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}\n              />\n            </div>\n          </div>\n\n          <div className=\"filter-actions\">\n            <button className=\"btn btn-primary\" onClick={applyFilters} disabled={loading}>\n              Apply Filters\n            </button>\n            <button className=\"btn btn-secondary\" onClick={clearFilters}>\n              Clear Filters\n            </button>\n          </div>\n        </div>\n      )}\n\n      {/* Error Message */}\n      {error && (\n        <div className=\"error-message\">\n          ❌ {error}\n        </div>\n      )}\n\n      {/* Stats Summary */}\n      <div className=\"stats-summary\">\n        <div className=\"stat-item\">\n          <span className=\"stat-label\">Total Records:</span>\n          <span className=\"stat-value\">{pagination.total.toLocaleString()}</span>\n        </div>\n        <div className=\"stat-item\">\n          <span className=\"stat-label\">Showing:</span>\n          <span className=\"stat-value\">{logs.length.toLocaleString()}</span>\n        </div>\n      </div>\n\n      {/* Logs Table */}\n      <div className=\"logs-table-container\">\n        <table className=\"logs-table\">\n          <thead>\n            <tr>\n              <th>Sent At</th>\n              <th>User</th>\n              <th>Email</th>\n              <th>Subject</th>\n              <th>Message</th>\n              <th>Provider</th>\n              <th>Status</th>\n              <th>Actions</th>\n            </tr>\n          </thead>\n          <tbody>\n            {logs.map((log) => (\n              <tr key={log.id} className={log.status === \"failed\" ? \"row-error\" : \"\"}>\n                <td className=\"date-cell\">{formatDate(log.sentAt)}</td>\n                <td className=\"user-cell\">\n                  <div className=\"user-info\">\n                    <div className=\"user-name\">\n                      {log.user.firstName && log.user.lastName\n                        ? `${log.user.firstName} ${log.user.lastName}`\n                        : \"Unknown User\"}\n                    </div>\n                    <div className=\"user-role\">{log.user.role}</div>\n                    <div className=\"user-id\">{log.userId}</div>\n                  </div>\n                </td>\n                <td className=\"email-cell\">{log.email}</td>\n                <td className=\"subject-cell\">\n                  <div className=\"subject-text\" title={log.subject}>\n                    {truncateText(log.subject, 50)}\n                  </div>\n                  {log.template && (\n                    <div className=\"template-name\">📝 {log.template}</div>\n                  )}\n                </td>\n                <td className=\"message-cell\">\n                  <div className=\"message-preview\" title={log.message}>\n                    {truncateText(log.message, 100)}\n                  </div>\n                </td>\n                <td className=\"provider-cell\">{getProviderBadge(log.provider)}</td>\n                <td className=\"status-cell\">{getStatusBadge(log.status)}</td>\n                <td className=\"actions-cell\">\n                  <button\n                    className=\"btn btn-sm btn-secondary\"\n                    onClick={() => {\n                      // Show full log details in modal (to be implemented)\n                      console.log(\"Show log details:\", log);\n                    }}\n                  >\n                    View\n                  </button>\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n\n        {logs.length === 0 && !loading && (\n          <div className=\"no-data\">\n            📭 No notification logs found matching your criteria.\n          </div>\n        )}\n      </div>\n\n      {/* Load More */}\n      {pagination.hasMore && (\n        <div className=\"load-more\">\n          <button className=\"btn btn-outline\" onClick={loadMore} disabled={loading}>\n            {loading ? \"Loading...\" : \"Load More\"}\n          </button>\n        </div>\n      )}\n\n      {/* Loading Indicator */}\n      {loading && (\n        <div className=\"loading-overlay\">\n          <div className=\"loading-spinner\"></div>\n        </div>\n      )}\n    </div>\n  );\n};\n\nexport default NotificationLogs;"
