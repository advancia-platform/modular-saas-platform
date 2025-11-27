import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import ComplianceReporting from "./ComplianceReporting";

interface NotificationStats {
  counts: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    failed: number;
  };
  byProvider: Array<{
    provider: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComplianceReporting, setShowComplianceReporting] = useState(false);

  // Fetch notification stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/notification-stats", {
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
        setStats(data.data);
      } else {
        throw new Error("Failed to fetch notification stats");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      console.error("Error fetching notification stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const calculateSuccessRate = () => {
    if (!stats) return 0;
    const { total, failed } = stats.counts;
    return total > 0 ? Math.round(((total - failed) / total) * 100) : 0;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      gmail: "#ea4335",
      resend: "#8b5cf6",
      sendgrid: "#1a82e2",
    };
    return colors[provider.toLowerCase()] || "#6b7280";
  };

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>📊 Admin Dashboard</h1>
        <p className="page-description">
          Monitor system activity, notification delivery, and administrative actions.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <a href="/admin/notification-logs" className="action-card">
            <div className="action-icon">📧</div>
            <div className="action-content">
              <h4>Notification Logs</h4>
              <p>View and audit all sent emails</p>
            </div>
          </a>

          <a href="/admin/audit-trail" className="action-card">
            <div className="action-icon">🔍</div>
            <div className="action-content">
              <h4>Admin Audit Trail</h4>
              <p>Track administrative actions</p>
            </div>
          </a>

          <a href="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h4>User Management</h4>
              <p>Manage user accounts</p>
            </div>
          </a>

          <a href="/admin/transactions" className="action-card">
            <div className="action-icon">💰</div>
            <div className="action-content">
              <h4>Transactions</h4>
              <p>Monitor financial activity</p>
            </div>
          </a>

          <button
            className="action-card action-button"
            onClick={() => setShowComplianceReporting(true)}
          >
            <div className="action-icon">📋</div>
            <div className="action-content">
              <h4>Compliance Reports</h4>
              <p>Generate audit compliance reports</p>
            </div>
          </button>
        </div>
      </div>

      {/* Notification Statistics */}
      <div className="statistics-section">
        <div className="section-header">
          <h3>📈 Notification Statistics</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchStats}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"} 🔄
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {stats && (
          <>
            {/* Overview Cards */}
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">📧</div>
                <div className="stat-content">
                  <div className="stat-number">{formatNumber(stats.counts.total)}</div>
                  <div className="stat-label">Total Emails Sent</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{calculateSuccessRate()}%</div>
                  <div className="stat-label">Success Rate</div>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <div className="stat-number">{formatNumber(stats.counts.failed)}</div>
                  <div className="stat-label">Failed Deliveries</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-number">{formatNumber(stats.counts.today)}</div>
                  <div className="stat-label">Sent Today</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-number">{formatNumber(stats.counts.thisWeek)}</div>
                  <div className="stat-label">This Week</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-number">{formatNumber(stats.counts.thisMonth)}</div>
                  <div className="stat-label">This Month</div>
                </div>
              </div>
            </div>

            {/* Provider & Status Breakdown */}
            <div className="breakdown-grid">
              {/* By Provider */}
              <div className="breakdown-card">
                <h4>📮 By Provider</h4>
                <div className="breakdown-list">
                  {stats.byProvider.map((item, index) => (
                    <div key={index} className="breakdown-item">
                      <div className="breakdown-info">
                        <span
                          className="provider-indicator"
                          style={{ backgroundColor: getProviderColor(item.provider) }}
                        ></span>
                        <span className="breakdown-label">{item.provider}</span>
                      </div>
                      <span className="breakdown-value">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Status */}
              <div className="breakdown-card">
                <h4>📊 By Status</h4>
                <div className="breakdown-list">
                  {stats.byStatus.map((item, index) => (
                    <div key={index} className="breakdown-item">
                      <div className="breakdown-info">
                        <span
                          className={`status-indicator ${item.status === "sent" ? "success" : "error"}`}
                        ></span>
                        <span className="breakdown-label">{item.status}</span>
                      </div>
                      <span className="breakdown-value">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading statistics...</p>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="health-section">
        <h3>🔋 System Health</h3>
        <div className="health-grid">
          <div className="health-item">
            <div className="health-indicator success"></div>
            <span className="health-label">Email Service</span>
            <span className="health-status">Operational</span>
          </div>

          <div className="health-item">
            <div className="health-indicator success"></div>
            <span className="health-label">Database</span>
            <span className="health-status">Connected</span>
          </div>

          <div className="health-item">
            <div className="health-indicator success"></div>
            <span className="health-label">API Gateway</span>
            <span className="health-status">Responsive</span>
          </div>

          <div className="health-item">
            <div className="health-indicator warning"></div>
            <span className="health-label">Background Jobs</span>
            <span className="health-status">Monitoring</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>🕒 Quick Links</h3>
        <div className="activity-links">
          <a href="/admin/notification-logs?status=failed" className="activity-link error">
            View Failed Email Deliveries
          </a>
          <a href={`/admin/notification-logs?startDate=${new Date().toISOString().split('T')[0]}`} className="activity-link info">
            Today's Email Activity
          </a>
          <a href={`/admin/audit-trail?startDate=${new Date().toISOString().split('T')[0]}`} className="activity-link primary">
            Today's Admin Actions
          </a>
          <a href="/admin/support" className="activity-link warning">
            Pending Support Tickets
          </a>
        </div>
      </div>

      {/* Compliance Reporting Modal */}
      <ComplianceReporting
        isVisible={showComplianceReporting}
        onClose={() => setShowComplianceReporting(false)}
      />
    </div>
  );
};

export default AdminDashboard;
