'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import PaymentSplitChart from '@/components/charts/PaymentSplitChart';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  provider: 'stripe' | 'cryptomus' | 'nowpayments' | 'alchemypay';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
}

// Mock data - replace with API call
const mockPayments: Payment[] = [
  {
    id: '1',
    orderId: 'ORD-001',
    userId: 'usr-123',
    userEmail: 'john@example.com',
    provider: 'stripe',
    amount: 500,
    currency: 'USD',
    status: 'completed',
    createdAt: '2025-01-15T10:30:00Z',
    completedAt: '2025-01-15T10:31:00Z',
  },
  {
    id: '2',
    orderId: 'ORD-002',
    userId: 'usr-456',
    userEmail: 'jane@example.com',
    provider: 'cryptomus',
    amount: 1200,
    currency: 'USD',
    status: 'completed',
    createdAt: '2025-01-15T09:20:00Z',
    completedAt: '2025-01-15T09:25:00Z',
  },
  {
    id: '3',
    orderId: 'ORD-003',
    userId: 'usr-789',
    userEmail: 'bob@example.com',
    provider: 'nowpayments',
    amount: 350,
    currency: 'USD',
    status: 'pending',
    createdAt: '2025-01-15T08:15:00Z',
  },
  {
    id: '4',
    orderId: 'ORD-004',
    userId: 'usr-101',
    userEmail: 'alice@example.com',
    provider: 'alchemypay',
    amount: 2500,
    currency: 'USD',
    status: 'completed',
    createdAt: '2025-01-14T16:45:00Z',
    completedAt: '2025-01-14T16:50:00Z',
  },
  {
    id: '5',
    orderId: 'ORD-005',
    userId: 'usr-102',
    userEmail: 'charlie@example.com',
    provider: 'stripe',
    amount: 150,
    currency: 'USD',
    status: 'failed',
    createdAt: '2025-01-14T14:30:00Z',
  },
  {
    id: '6',
    orderId: 'ORD-006',
    userId: 'usr-103',
    userEmail: 'diana@example.com',
    provider: 'cryptomus',
    amount: 800,
    currency: 'USD',
    status: 'completed',
    createdAt: '2025-01-14T12:00:00Z',
    completedAt: '2025-01-14T12:10:00Z',
  },
  {
    id: '7',
    orderId: 'ORD-007',
    userId: 'usr-104',
    userEmail: 'eve@example.com',
    provider: 'nowpayments',
    amount: 450,
    currency: 'USD',
    status: 'refunded',
    createdAt: '2025-01-13T18:20:00Z',
  },
  {
    id: '8',
    orderId: 'ORD-008',
    userId: 'usr-105',
    userEmail: 'frank@example.com',
    provider: 'alchemypay',
    amount: 1750,
    currency: 'USD',
    status: 'completed',
    createdAt: '2025-01-13T15:10:00Z',
    completedAt: '2025-01-13T15:15:00Z',
  },
];

const providerColors: Record<string, string> = {
  stripe: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cryptomus: 'bg-green-500/20 text-green-400 border-green-500/30',
  nowpayments: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  alchemypay: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  refunded: <AlertTriangle className="w-4 h-4 text-orange-400" />,
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
  refunded: 'bg-orange-500/20 text-orange-400',
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    // TODO: Fetch payments from API
    // fetchPayments();
  }, [router]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === 'all' || payment.provider === filterProvider;
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesProvider && matchesStatus;
  });

  // Chart data
  const revenueChartData = {
    labels: ['Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14', 'Jan 15'],
    datasets: [
      {
        label: 'Revenue',
        data: [4500, 5200, 4800, 6100, 5800, 7200],
      },
      {
        label: 'Transactions',
        data: [3200, 3800, 3500, 4200, 4000, 5100],
      },
    ],
  };

  const paymentSplitData = [
    { label: 'Stripe', value: 45000, color: 'rgb(59, 130, 246)' },
    { label: 'Cryptomus', value: 32000, color: 'rgb(34, 197, 94)' },
    { label: 'NOWPayments', value: 18000, color: 'rgb(147, 51, 234)' },
    { label: 'AlchemyPay', value: 25000, color: 'rgb(249, 115, 22)' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-purple-400" />
                Payments
              </h1>
              <p className="text-gray-400 mt-1">Manage and monitor all payment transactions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPayments}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueLineChart
              labels={revenueChartData.labels}
              datasets={revenueChartData.datasets}
              title="Revenue Trend"
              subtitle="Last 7 days"
              height={250}
            />
            <PaymentSplitChart
              data={paymentSplitData}
              title="Payment Methods"
              subtitle="Distribution by provider"
              height={250}
              variant="doughnut"
            />
          </div>

          {/* Filters */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order ID, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Provider Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Providers</option>
                  <option value="stripe">Stripe</option>
                  <option value="cryptomus">Cryptomus</option>
                  <option value="nowpayments">NOWPayments</option>
                  <option value="alchemypay">AlchemyPay</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-purple-400">{payment.orderId}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-white">{payment.userEmail}</p>
                          <p className="text-xs text-gray-400">{payment.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full border capitalize',
                            providerColors[payment.provider]
                          )}
                        >
                          {payment.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-white">
                          ${payment.amount.toLocaleString()} {payment.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full capitalize',
                            statusColors[payment.status]
                          )}
                        >
                          {statusIcons[payment.status]}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">
                          {formatDate(payment.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/admin/payments/${payment.id}`)}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
                  Previous
                </button>
                <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors text-sm">
                  1
                </button>
                <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
                  2
                </button>
                <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
