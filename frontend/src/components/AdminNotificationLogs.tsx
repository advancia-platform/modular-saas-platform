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
    } finally {
      setLoading(false);
    }
  };

  // Load more logs (pagination)
  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
      fetchLogs(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchLogs(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      email: \"\",
      subject: \"\",
      startDate: \"\",
      endDate: \"\",
      userId: \"\",
      provider: \"\",
      status: \"\",
    });
  };

  // Export to CSV
  const exportLogs = async () => {
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== \"\"))
      );

      const response = await fetch(`/api/admin/notification-logs/export?${query}`, {
        headers: {
          \"Authorization\": `Bearer ${localStorage.getItem(\"token\")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement(\"a\");
      link.href = url;
      link.download = `notification_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : \"Export failed\";
      setError(errorMsg);
    }
  };

  // Initialize
  useEffect(() => {
    fetchLogs();
  }, []);

  // Update when pagination offset changes (for load more)
  useEffect(() => {
    if (pagination.offset > 0) {
      fetchLogs(false);
    }
  }, [pagination.offset]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getStatusBadge = (status: string) => {
    const className = status === \"sent\" ? \"status-success\" : \"status-error\";
    return <span className={`status-badge ${className}`}>{status}</span>;
  };

  const getProviderBadge = (provider: string) => {
    return <span className=\"provider-badge\">{provider}</span>;
  };

  return (
    <div className=\"notification-logs\">
      <div className=\"page-header\">
        <h2>📧 Notification Logs</h2>
        <p className=\"page-description\">
          Monitor and audit all emails sent by the system for compliance and debugging.
        </p>
      </div>

      {/* Controls */}
      <div className=\"controls\">
        <button
          className=\"btn btn-secondary\"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? \"Hide Filters\" : \"Show Filters\"} 🔍
        </button>
        <button className=\"btn btn-primary\" onClick={() => fetchLogs(true)} disabled={loading}>
          {loading ? \"Loading...\" : \"Refresh\"} 🔄
        </button>
        <button className=\"btn btn-success\" onClick={exportLogs} disabled={loading}>
          Export CSV 📥
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className=\"filters\">
          <div className=\"filter-grid\">
            <div className=\"filter-group\">
              <label>Email:</label>
              <input
                type=\"text\"
                placeholder=\"Filter by email address\"
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              />
            </div>

            <div className=\"filter-group\">
              <label>Subject:</label>
              <input
                type=\"text\"
                placeholder=\"Filter by email subject\"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              />
            </div>

            <div className=\"filter-group\">
              <label>User ID:</label>
              <input
                type=\"text\"
                placeholder=\"Filter by user ID\"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>

            <div className=\"filter-group\">
              <label>Provider:</label>
              <select
                value={filters.provider}
                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
              >
                <option value=\"\">All Providers</option>
                <option value=\"gmail\">Gmail</option>
                <option value=\"resend\">Resend</option>
                <option value=\"sendgrid\">SendGrid</option>
              </select>
            </div>

            <div className=\"filter-group\">
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value=\"\">All Status</option>
                <option value=\"sent\">Sent</option>
                <option value=\"failed\">Failed</option>
              </select>
            </div>

            <div className=\"filter-group\">
              <label>Start Date:</label>
              <input
                type=\"date\"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className=\"filter-group\">
              <label>End Date:</label>
              <input
                type=\"date\"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className=\"filter-actions\">
            <button className=\"btn btn-primary\" onClick={applyFilters} disabled={loading}>
              Apply Filters
            </button>
            <button className=\"btn btn-secondary\" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className=\"error-message\">
          ❌ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className=\"stats-summary\">
        <div className=\"stat-item\">
          <span className=\"stat-label\">Total Records:</span>
          <span className=\"stat-value\">{pagination.total.toLocaleString()}</span>
        </div>
        <div className=\"stat-item\">
          <span className=\"stat-label\">Showing:</span>
          <span className=\"stat-value\">{logs.length.toLocaleString()}</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className=\"logs-table-container\">
        <table className=\"logs-table\">
          <thead>
            <tr>
              <th>Sent At</th>
              <th>User</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className={log.status === \"failed\" ? \"row-error\" : \"\"}>
                <td className=\"date-cell\">{formatDate(log.sentAt)}</td>
                <td className=\"user-cell\">
                  <div className=\"user-info\">
                    <div className=\"user-name\">
                      {log.user.firstName && log.user.lastName
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : \"Unknown User\"}
                    </div>
                    <div className=\"user-role\">{log.user.role}</div>
                    <div className=\"user-id\">{log.userId}</div>
                  </div>
                </td>
                <td className=\"email-cell\">{log.email}</td>
                <td className=\"subject-cell\">
                  <div className=\"subject-text\" title={log.subject}>
                    {truncateText(log.subject, 50)}
                  </div>
                  {log.template && (
                    <div className=\"template-name\">📝 {log.template}</div>
                  )}
                </td>
                <td className=\"message-cell\">
                  <div className=\"message-preview\" title={log.message}>
                    {truncateText(log.message, 100)}
                  </div>
                </td>
                <td className=\"provider-cell\">{getProviderBadge(log.provider)}</td>
                <td className=\"status-cell\">{getStatusBadge(log.status)}</td>
                <td className=\"actions-cell\">
                  <button
                    className=\"btn btn-sm btn-secondary\"
                    onClick={() => {
                      // Show full log details in modal (to be implemented)
                      console.log(\"Show log details:\", log);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && !loading && (
          <div className=\"no-data\">
            📭 No notification logs found matching your criteria.
          </div>
        )}
      </div>

      {/* Load More */}
      {pagination.hasMore && (
        <div className=\"load-more\">
          <button className=\"btn btn-outline\" onClick={loadMore} disabled={loading}>
            {loading ? \"Loading...\" : \"Load More\"}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className=\"loading-overlay\">
          <div className=\"loading-spinner\"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationLogs;"
