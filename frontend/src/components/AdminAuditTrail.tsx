import React, { useEffect, useState } from "react";
import "./AdminAuditTrail.css";

interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  target?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  admin: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

interface FilterState {
  adminId: string;
  action: string;
  target: string;
  role: string;
  startDate: string;
  endDate: string;
}

interface PaginationState {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const AdminAuditTrail: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const [filters, setFilters] = useState<FilterState>({
    adminId: "",
    action: "",
    target: "",
    role: "",
    startDate: "",
    endDate: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs from API
  const fetchAuditLogs = async (resetOffset = true) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
        limit: pagination.limit.toString(),
        offset: resetOffset ? "0" : pagination.offset.toString(),
      });

      const response = await fetch(`/api/admin/audit-trail?${query}`, {
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
          setAuditLogs(data.data.auditLogs);
          setPagination({ ...data.data.pagination, limit: pagination.limit });
        } else {
          setAuditLogs((prev) => [...prev, ...data.data.auditLogs]);
          setPagination(data.data.pagination);
        }
      } else {
        throw new Error("Failed to fetch audit trail");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      console.error("Error fetching admin audit trail:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load more logs (pagination)
  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
      fetchAuditLogs(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchAuditLogs(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      adminId: "",
      action: "",
      target: "",
      role: "",
      startDate: "",
      endDate: "",
    });
  };

  // Export to CSV
  const exportAuditTrail = async () => {
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""))
      );

      const response = await fetch(`/api/admin/audit-trail/export?${query}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admin_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Export failed";
      setError(errorMsg);
    }
  };

  // Initialize
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Update when pagination offset changes (for load more)
  useEffect(() => {
    if (pagination.offset > 0) {
      fetchAuditLogs(false);
    }
  }, [pagination.offset]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getActionBadge = (action: string) => {
    let className = "action-badge";

    if (action.includes("VIEW")) {
      className += " action-read";
    } else if (action.includes("EXPORT")) {
      className += " action-export";
    } else if (action.includes("DELETE") || action.includes("REMOVE")) {
      className += " action-danger";
    } else if (action.includes("CREATE") || action.includes("ADD")) {
      className += " action-success";
    } else if (action.includes("UPDATE") || action.includes("EDIT")) {
      className += " action-warning";
    } else {
      className += " action-default";
    }

    return <span className={className}>{action}</span>;
  };

  const getRoleBadge = (role: string) => {
    const className = `role-badge role-${role.toLowerCase().replace('_', '-')}`;
    return <span className={className}>{role}</span>;
  };

  const parseDetailsJson = (details?: string) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <div className="admin-audit-trail">
      <div className="page-header">
        <h2>🔍 Admin Audit Trail</h2>
        <p className="page-description">
          Track all administrative actions for security compliance and forensic analysis.
        </p>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"} 🔍
        </button>
        <button className="btn btn-primary" onClick={() => fetchAuditLogs(true)} disabled={loading}>
          {loading ? "Loading..." : "Refresh"} 🔄
        </button>
        <button className="btn btn-success" onClick={exportAuditTrail} disabled={loading}>
          Export CSV 📥
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Admin ID:</label>
              <input
                type="text"
                placeholder="Filter by admin user ID"
                value={filters.adminId}
                onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>Role:</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="FINANCE_ADMIN">Finance Admin</option>
                <option value="SUPPORT_ADMIN">Support Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="AUDITOR">Auditor</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Action:</label>
              <input
                type="text"
                placeholder="Filter by action type"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>Target:</label>
              <input
                type="text"
                placeholder="Filter by action target"
                value={filters.target}
                onChange={(e) => setFilters({ ...filters, target: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
              Apply Filters
            </button>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Records:</span>
          <span className="stat-value">{pagination.total.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Showing:</span>
          <span className="stat-value">{auditLogs.length.toLocaleString()}</span>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => {
              const parsedDetails = parseDetailsJson(log.details);

              return (
                <tr key={log.id}>
                  <td className="date-cell">{formatDate(log.timestamp)}</td>
                  <td className="admin-cell">
                    <div className="admin-info">
                      <div className="admin-name">
                        {log.admin.name ||
                         (log.admin.firstName && log.admin.lastName
                          ? `${log.admin.firstName} ${log.admin.lastName}`
                          : "Unknown Admin")}
                      </div>
                      {getRoleBadge(log.admin.role)}
                      <div className="admin-email">{log.admin.email}</div>
                      <div className="admin-id">{log.adminId}</div>
                    </div>
                  </td>
                  <td className="action-cell">{getActionBadge(log.action)}</td>
                  <td className="target-cell">
                    <div className="target-text" title={log.target || ""}>
                      {log.target ? truncateText(log.target, 50) : "-"}
                    </div>
                  </td>
                  <td className="details-cell">
                    {parsedDetails ? (
                      typeof parsedDetails === "object" ? (
                        <details className="details-expandable">
                          <summary>View Details</summary>
                          <pre className="details-json">
                            {JSON.stringify(parsedDetails, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <div className="details-text" title={parsedDetails}>
                          {truncateText(parsedDetails, 100)}
                        </div>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="ip-cell">
                    <span className="ip-address">{log.ipAddress || "-"}</span>
                  </td>
                  <td className="ua-cell">
                    <div className="user-agent" title={log.userAgent || ""}>
                      {log.userAgent ? truncateText(log.userAgent, 30) : "-"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {auditLogs.length === 0 && !loading && (
          <div className="no-data">
            🔍 No audit trail records found matching your criteria.
          </div>
        )}
      </div>

      {/* Load More */}
      {pagination.hasMore && (
        <div className="load-more">
          <button className="btn btn-outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditTrail;
