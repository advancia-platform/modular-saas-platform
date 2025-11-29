'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { hasPermission, useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';

interface CreditLimits {
  PROMOTIONAL_CREDIT: { max: number; requiresApproval: number; dailyLimit: number };
  REFUND: { max: number; requiresApproval: number; dailyLimit: number };
  COMPENSATION: { max: number; requiresApproval: number; dailyLimit: number };
  BONUS: { max: number; requiresApproval: number; dailyLimit: number };
}

interface DailyUsage {
  total: number;
  count: number;
}

interface CreditHistoryItem {
  id: string;
  userId: string;
  amount: string;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  user: { id: string; email: string; name: string } | null;
}

const CREDIT_TYPES = [
  {
    value: 'PROMOTIONAL_CREDIT',
    label: 'Promotional Credit',
    description: 'Marketing and promotional credits',
  },
  { value: 'REFUND', label: 'Refund', description: 'Customer refunds for issues' },
  { value: 'COMPENSATION', label: 'Compensation', description: 'Compensation for service issues' },
  { value: 'BONUS', label: 'Bonus', description: 'Loyalty and referral bonuses' },
];

function AdminCreditsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [creditType, setCreditType] = useState('PROMOTIONAL_CREDIT');
  const [reason, setReason] = useState('');
  const [referenceId, setReferenceId] = useState('');

  // Data state
  const [limits, setLimits] = useState<CreditLimits | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [canBypassLimits, setCanBypassLimits] = useState(false);

  const fetchLimitsAndUsage = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [limitsRes, usageRes, historyRes] = await Promise.all([
        fetch('/api/admin/credits/limits', { headers }),
        fetch('/api/admin/credits/daily-usage', { headers }),
        fetch('/api/admin/credits/history?limit=10', { headers }),
      ]);

      if (limitsRes.ok) {
        const data = await limitsRes.json();
        setLimits(data.limits);
        setCanBypassLimits(data.canBypassLimits);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        setDailyUsage(data.today);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.credits || []);
      }
    } catch (err) {
      console.error('Failed to fetch limits:', err);
    }
  }, []);

  useEffect(() => {
    fetchLimitsAndUsage();
  }, [fetchLimitsAndUsage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          type: creditType,
          reason,
          referenceId: referenceId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue credit');
      }

      if (data.requiresApproval) {
        setSuccess(data.message);
      } else {
        setSuccess(`Successfully issued $${amount} ${creditType} to ${data.user?.email || userId}`);
        // Reset form
        setUserId('');
        setAmount('');
        setReason('');
        setReferenceId('');
        // Refresh data
        fetchLimitsAndUsage();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeConfig = limits?.[creditType as keyof CreditLimits];

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Admin Credits</h1>
            <p className="text-base-content/60 mt-1">
              Issue promotional credits, refunds, and compensation to users
            </p>
          </div>
          {canBypassLimits && (
            <div className="badge badge-primary badge-lg">🔓 Super Admin - Limits Bypassed</div>
          )}
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{success}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setSuccess(null)}>
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Credit Form */}
          <div className="lg:col-span-2 card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Issue Credit</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User ID */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">User ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter user ID (e.g., cuid or email)"
                    className="input input-bordered"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  />
                </div>

                {/* Credit Type */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Credit Type</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={creditType}
                    onChange={(e) => setCreditType(e.target.value)}
                    required
                  >
                    {CREDIT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Amount (USD)</span>
                    {selectedTypeConfig && !canBypassLimits && (
                      <span className="label-text-alt">
                        Max: ${selectedTypeConfig.max} | Approval needed above: $
                        {selectedTypeConfig.requiresApproval}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={canBypassLimits ? undefined : selectedTypeConfig?.max}
                      placeholder="0.00"
                      className="input input-bordered w-full pl-8"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reason</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Describe why this credit is being issued..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>

                {/* Reference ID (Optional) */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reference ID (Optional)</span>
                    <span className="label-text-alt">Support ticket, order ID, etc.</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TICKET-12345"
                    className="input input-bordered"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                  />
                </div>

                {/* Submit */}
                <div className="card-actions justify-end pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || (user?.role && !hasPermission(user.role, 'manage_ledger'))}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing...
                      </>
                    ) : (
                      'Issue Credit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Usage & Limits */}
          <div className="space-y-6">
            {/* Daily Usage */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Today&apos;s Usage</h3>
                {dailyUsage ? (
                  <div className="stat p-0">
                    <div className="stat-value text-primary">${dailyUsage.total.toFixed(2)}</div>
                    <div className="stat-desc">{dailyUsage.count} credits issued today</div>
                  </div>
                ) : (
                  <div className="animate-pulse h-16 bg-base-300 rounded"></div>
                )}
              </div>
            </div>

            {/* Limits Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">Credit Limits</h3>
                {limits ? (
                  <div className="overflow-x-auto">
                    <table className="table table-xs">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Max</th>
                          <th>Daily</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(limits).map(([type, config]) => (
                          <tr key={type} className={creditType === type ? 'active' : ''}>
                            <td className="font-mono text-xs">{type.replace('_', ' ')}</td>
                            <td>${config.max}</td>
                            <td>${config.dailyLimit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="animate-pulse h-32 bg-base-300 rounded"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Credit History</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? (
                    history.map((item) => (
                      <tr key={item.id}>
                        <td className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="text-sm font-medium">
                            {item.user?.email || item.userId}
                          </div>
                          {item.user?.name && (
                            <div className="text-xs text-base-content/60">{item.user.name}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-outline badge-sm">{item.type}</span>
                        </td>
                        <td className="font-mono text-success">${item.amount}</td>
                        <td className="max-w-xs truncate text-sm">{item.description}</td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              item.status === 'completed'
                                ? 'badge-success'
                                : item.status === 'pending'
                                  ? 'badge-warning'
                                  : 'badge-ghost'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-base-content/60 py-8">
                        No credits issued yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCreditsPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'FINANCE_ADMIN', 'admin']}>
      <AdminCreditsPage />
    </ProtectedRoute>
  );
}
