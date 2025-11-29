'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LedgerEntry {
  id: string;
  type: 'credit' | 'debit';
  category: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'reward' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  balance: number;
  description: string;
  userId: string;
  userEmail: string;
  referenceId?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Mock data - replace with API call
const mockLedgerEntries: LedgerEntry[] = [
  {
    id: '1',
    type: 'credit',
    category: 'deposit',
    amount: 500,
    currency: 'USD',
    balance: 1500,
    description: 'Stripe deposit',
    userId: 'usr-123',
    userEmail: 'john@example.com',
    referenceId: 'ORD-001',
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '2',
    type: 'debit',
    category: 'withdrawal',
    amount: 200,
    currency: 'USD',
    balance: 1300,
    description: 'Crypto withdrawal to BTC wallet',
    userId: 'usr-123',
    userEmail: 'john@example.com',
    referenceId: 'WD-001',
    createdAt: '2025-01-15T09:20:00Z',
  },
  {
    id: '3',
    type: 'credit',
    category: 'reward',
    amount: 25,
    currency: 'USD',
    balance: 825,
    description: 'Referral bonus',
    userId: 'usr-456',
    userEmail: 'jane@example.com',
    createdAt: '2025-01-15T08:15:00Z',
  },
  {
    id: '4',
    type: 'debit',
    category: 'fee',
    amount: 5,
    currency: 'USD',
    balance: 2495,
    description: 'Transaction fee',
    userId: 'usr-789',
    userEmail: 'bob@example.com',
    referenceId: 'FEE-001',
    createdAt: '2025-01-14T16:45:00Z',
  },
  {
    id: '5',
    type: 'credit',
    category: 'deposit',
    amount: 1200,
    currency: 'USD',
    balance: 3200,
    description: 'NOWPayments BTC deposit',
    userId: 'usr-101',
    userEmail: 'alice@example.com',
    referenceId: 'ORD-002',
    createdAt: '2025-01-14T14:30:00Z',
  },
  {
    id: '6',
    type: 'debit',
    category: 'transfer',
    amount: 100,
    currency: 'USD',
    balance: 3100,
    description: 'Internal transfer to user usr-102',
    userId: 'usr-101',
    userEmail: 'alice@example.com',
    referenceId: 'TRF-001',
    createdAt: '2025-01-14T12:00:00Z',
  },
  {
    id: '7',
    type: 'credit',
    category: 'refund',
    amount: 150,
    currency: 'USD',
    balance: 950,
    description: 'Refund for failed transaction',
    userId: 'usr-103',
    userEmail: 'charlie@example.com',
    referenceId: 'REF-001',
    createdAt: '2025-01-13T18:20:00Z',
  },
  {
    id: '8',
    type: 'credit',
    category: 'adjustment',
    amount: 50,
    currency: 'USD',
    balance: 2050,
    description: 'Admin adjustment - promotional credit',
    userId: 'usr-104',
    userEmail: 'diana@example.com',
    createdAt: '2025-01-13T15:10:00Z',
  },
];

const categoryColors: Record<string, string> = {
  deposit: 'bg-green-500/20 text-green-400 border-green-500/30',
  withdrawal: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  transfer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fee: 'bg-red-500/20 text-red-400 border-red-500/30',
  reward: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  refund: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  adjustment: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

export default function AdminLedgerPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LedgerEntry[]>(mockLedgerEntries);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    // TODO: Fetch ledger entries from API
    // fetchLedgerEntries();
  }, [router]);

  const fetchLedgerEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/ledger', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.referenceId?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate summary stats
  const summary = {
    totalCredits: entries.filter((e) => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0),
    totalDebits: entries.filter((e) => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0),
    netChange: entries.reduce((sum, e) => sum + (e.type === 'credit' ? e.amount : -e.amount), 0),
    totalEntries: entries.length,
  };

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
                <BookOpen className="w-8 h-8 text-purple-400" />
                Ledger
              </h1>
              <p className="text-gray-400 mt-1">Track all financial transactions and balances</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchLedgerEntries}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Credits</span>
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">
                +${summary.totalCredits.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Debits</span>
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">
                -${summary.totalDebits.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Net Change</span>
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <p
                className={cn(
                  'text-2xl font-bold',
                  summary.netChange >= 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {summary.netChange >= 0 ? '+' : ''}${summary.netChange.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Entries</span>
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{summary.totalEntries}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by description, email, user ID, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                </select>
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer">Transfers</option>
                <option value="fee">Fees</option>
                <option value="reward">Rewards</option>
                <option value="refund">Refunds</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Balance
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
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded',
                            entry.type === 'credit'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {entry.type === 'credit' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                          <span className="text-xs font-medium capitalize">{entry.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'px-3 py-1 text-xs font-medium rounded-full border capitalize',
                            categoryColors[entry.category]
                          )}
                        >
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-white truncate">{entry.description}</p>
                          {entry.referenceId && (
                            <p className="text-xs text-gray-400 font-mono">{entry.referenceId}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-white">{entry.userEmail}</p>
                          <p className="text-xs text-gray-400">{entry.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            entry.type === 'credit' ? 'text-green-400' : 'text-red-400'
                          )}
                        >
                          {entry.type === 'credit' ? '+' : '-'}${entry.amount.toLocaleString()}{' '}
                          {entry.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white font-medium">
                          ${entry.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{formatDate(entry.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/admin/ledger/${entry.id}`)}
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
                Showing {filteredEntries.length} of {entries.length} entries
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
