import React, { useState } from 'react';
import './ComplianceReporting.css';

interface ComplianceReportStats {
  totalAdminActions: number;
  uniqueAdmins: number;
  criticalActions: number;
  failedActions: number;
  notificationsSent: number;
  failedNotifications: number;
}

interface ComplianceReportData {
  reportType: 'weekly' | 'monthly' | 'quarterly';
  period: {
    start: string;
    end: string;
  };
  stats: ComplianceReportStats;
  adminActivity: Array<{
    adminId: string;
    adminEmail: string;
    adminRole: string;
    actionsCount: number;
    lastActivity: string;
  }>;
  auditHighlights: Array<{
    action: string;
    count: number;
    admins: string[];
  }>;
}

interface ComplianceReportingProps {
  isVisible: boolean;
  onClose: () => void;
}

const ComplianceReporting: React.FC<ComplianceReportingProps> = ({ isVisible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ComplianceReportData | null>(null);
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // Set default date ranges based on report type
  const setDefaultDates = (type: 'weekly' | 'monthly' | 'quarterly') => {
    const now = new Date();
    let start = new Date();
    const end = new Date();

    switch (type) {
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(now.getMonth() - 3);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  React.useEffect(() => {
    setDefaultDates(reportType);
  }, [reportType]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/compliance/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/compliance/export-${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `compliance_report_${reportType}_${startDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const generateAutomaticReport = async (type: 'weekly' | 'monthly') => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/compliance/generate-${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate ${type} report`);
      }

      const result = await response.json();
      setError(`${type.charAt(0).toUpperCase() + type.slice(1)} compliance report generated and sent successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${type} report`);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="compliance-reporting-overlay">
      <div className="compliance-reporting-modal">
        <div className="compliance-reporting-header">
          <h2>Compliance Reporting</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="compliance-reporting-content">
          {error && (
            <div className={`alert ${error.includes('successfully') ? 'alert-success' : 'alert-error'}`}>
              {error}
            </div>
          )}

          <div className="report-generation-section">
            <h3>Generate Custom Report</h3>

            <div className="form-group">
              <label htmlFor="reportType">Report Type</label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="form-control"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div className="date-range-group">
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            <div className="action-buttons">
              <button
                onClick={generateReport}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>

              <button
                onClick={() => exportReport('csv')}
                disabled={loading}
                className="btn btn-secondary"
              >
                Export CSV
              </button>

              <button
                onClick={() => exportReport('pdf')}
                disabled={loading}
                className="btn btn-secondary"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="automatic-reports-section">
            <h3>Automatic Report Generation</h3>
            <p className="section-description">
              Generate and send compliance reports immediately to configured recipients.
            </p>

            <div className="action-buttons">
              <button
                onClick={() => generateAutomaticReport('weekly')}
                disabled={loading}
                className="btn btn-outline-primary"
              >
                Generate Weekly Report
              </button>

              <button
                onClick={() => generateAutomaticReport('monthly')}
                disabled={loading}
                className="btn btn-outline-primary"
              >
                Generate Monthly Report
              </button>
            </div>
          </div>

          {reportData && (
            <div className="report-results-section">
              <h3>Report Results</h3>

              <div className="report-summary">
                <div className="summary-header">
                  <h4>
                    {reportData.reportType.toUpperCase()} Report
                  </h4>
                  <span className="period">
                    {new Date(reportData.period.start).toLocaleDateString()} - {new Date(reportData.period.end).toLocaleDateString()}
                  </span>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{reportData.stats.totalAdminActions}</div>
                    <div className="stat-label">Total Admin Actions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reportData.stats.uniqueAdmins}</div>
                    <div className="stat-label">Unique Admins</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reportData.stats.criticalActions}</div>
                    <div className="stat-label">Critical Actions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reportData.stats.notificationsSent}</div>
                    <div className="stat-label">Notifications Sent</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reportData.stats.failedNotifications}</div>
                    <div className="stat-label">Failed Notifications</div>
                  </div>
                </div>
              </div>

              {reportData.adminActivity.length > 0 && (
                <div className="admin-activity-section">
                  <h4>Top Admin Activity</h4>
                  <div className="activity-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Admin</th>
                          <th>Role</th>
                          <th>Actions</th>
                          <th>Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.adminActivity.slice(0, 10).map((admin) => (
                          <tr key={admin.adminId}>
                            <td>{admin.adminEmail}</td>
                            <td>
                              <span className={`role-badge role-${admin.adminRole.toLowerCase()}`}>
                                {admin.adminRole}
                              </span>
                            </td>
                            <td>{admin.actionsCount}</td>
                            <td>{new Date(admin.lastActivity).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.auditHighlights.length > 0 && (
                <div className="audit-highlights-section">
                  <h4>Audit Highlights</h4>
                  <div className="highlights-list">
                    {reportData.auditHighlights.slice(0, 10).map((highlight, index) => (
                      <div key={index} className="highlight-item">
                        <div className="highlight-action">
                          <span className="action-name">{highlight.action}</span>
                          <span className="action-count">{highlight.count} times</span>
                        </div>
                        <div className="highlight-admins">
                          Performed by: {highlight.admins.slice(0, 3).join(', ')}
                          {highlight.admins.length > 3 && ` +${highlight.admins.length - 3} more`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceReporting;
