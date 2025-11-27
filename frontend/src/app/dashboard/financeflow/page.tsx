'use client';

import DashboardRouteGuard from '@/components/auth/DashboardRouteGuard';
import { useBalance } from '@/hooks/useBalance';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  Bitcoin,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  MoreVertical,
  PieChart,
  RefreshCw,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Types
interface FinanceData {
  totalBalance: number;
  monthlyChange: number;
  bonusEarnings: number;
  activeCards: number;
  cryptoAssets: number;
  portfolio: {
    USD: number;
    BTC: number;
    ETH: number;
    USDT: number;
  };
  transactions: Transaction[];
  cashFlow: CashFlowData[];
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  category: string;
  status: 'completed' | 'pending' | 'failed';
}

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

// Navigation items
const navigation = [
  { name: 'Dashboard', icon: PieChart, active: true },
  { name: 'Analytics', icon: BarChart3, active: false },
  { name: 'My Assets', icon: Wallet, active: false },
  { name: 'Earnings', icon: Target, active: false },
  { name: 'Settings', icon: Settings, active: false },
  { name: 'Profile', icon: User, active: false },
];

// Mock data (replace with real API calls)
const mockFinanceData: FinanceData = {
  totalBalance: 10242.5,
  monthlyChange: 12.5,
  bonusEarnings: 450,
  activeCards: 2,
  cryptoAssets: 5,
  portfolio: {
    USD: 6500.0,
    BTC: 0.15,
    ETH: 2.3,
    USDT: 1200.0,
  },
  transactions: [
    {
      id: '1',
      type: 'credit',
      amount: 2500.0,
      description: 'Salary Deposit',
      date: '2025-11-24',
      category: 'Income',
      status: 'completed',
    },
    {
      id: '2',
      type: 'debit',
      amount: -850.0,
      description: 'Rent Payment',
      date: '2025-11-23',
      category: 'Housing',
      status: 'completed',
    },
    {
      id: '3',
      type: 'credit',
      amount: 150.0,
      description: 'Freelance Payment',
      date: '2025-11-22',
      category: 'Income',
      status: 'pending',
    },
  ],
  cashFlow: [
    { month: 'Jan', income: 8500, expenses: 6200, net: 2300 },
    { month: 'Feb', income: 9200, expenses: 6800, net: 2400 },
    { month: 'Mar', income: 8900, expenses: 6500, net: 2400 },
    { month: 'Apr', income: 9800, expenses: 7100, net: 2700 },
    { month: 'May', income: 10200, expenses: 7300, net: 2900 },
    { month: 'Jun', income: 10500, expenses: 7600, net: 2900 },
  ],
};

export default function FinanceFlowPage() {
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [financeData, setFinanceData] = useState<FinanceData>(mockFinanceData);
  const [isLoading, setIsLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    'monthly'
  );

  const { data: session } = useSession();
  const userId =
    session?.user?.id || localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000001';
  const { balance } = useBalance(userId);

  // Fetch real cash flow data
  useEffect(() => {
    const fetchCashFlowData = async () => {
      setIsLoading(true);
      try {
        const cashFlowResponse = await cashFlowAPI.getCashFlow(userId, {
          period: selectedPeriod,
        });

        if (cashFlowResponse.success) {
          setFinanceData((prev) => ({
            ...prev,
            cashFlow: cashFlowResponse.data.cashFlow.map((item) => ({
              month: item.period,
              income: item.income,
              expenses: item.expenses,
              net: item.net,
            })),
            totalBalance: cashFlowResponse.data.summary.netCashFlow,
            monthlyChange: cashFlowResponse.data.summary.savingsRate,
          }));
        }
      } catch (error) {
        console.error('Error fetching cash flow:', error);
        toast.error('Failed to load cash flow data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchCashFlowData();
    }
  }, [userId, selectedPeriod]);

  // Export handlers
  const handleExportCSV = async () => {
    try {
      toast.loading('Generating CSV...', { id: 'csv-export' });
      const blob = await cashFlowAPI.exportToCSV(userId, { period: selectedPeriod });
      cashFlowAPI.downloadBlob(blob, `cashflow-${userId}-${Date.now()}.csv`);
      toast.success('CSV exported successfully!', { id: 'csv-export' });
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      const blob = await cashFlowAPI.exportToPDF(userId, { period: selectedPeriod });
      cashFlowAPI.downloadBlob(blob, `cashflow-${userId}-${Date.now()}.pdf`);
      toast.success('PDF exported successfully!', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  // Refresh data handler
  const handleRefresh = async () => {
    try {
      toast.loading('Refreshing data...', { id: 'refresh' });
      const cashFlowResponse = await cashFlowAPI.getCashFlow(userId, {
        period: selectedPeriod,
      });

      if (cashFlowResponse.success) {
        setFinanceData((prev) => ({
          ...prev,
          cashFlow: cashFlowResponse.data.cashFlow.map((item) => ({
            month: item.period,
            income: item.income,
            expenses: item.expenses,
            net: item.net,
          })),
          totalBalance: cashFlowResponse.data.summary.netCashFlow,
          monthlyChange: cashFlowResponse.data.summary.savingsRate,
        }));
        toast.success('Data refreshed!', { id: 'refresh' });
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh data', { id: 'refresh' });
    }
  };

  // Email notification handler
  const handleEmailToggle = async () => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: session?.user?.email,
          subject: `FinanceFlow Notification Settings Updated`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">FinanceFlow Dashboard</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Notification Settings Updated</p>
              </div>

              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">Settings Change Confirmation</h2>

                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Your email notification preferences have been successfully updated.
                </p>

                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #334155; margin: 0; font-weight: 600;">Current Status:</p>
                  <p style="color: #667eea; margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">
                    Email Notifications: ${emailNotifications ? 'Enabled' : 'Disabled'}
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.advanciapayledger.com'}/dashboard/financeflow"
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View Dashboard
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

                <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                  This email was sent from your FinanceFlow Dashboard. If you didn't make this change, please contact support.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (response.ok) {
        console.log('Email notification sent successfully');
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }

    setEmailNotifications(!emailNotifications);
  };

  if (isLoading) {
    return (
      <DashboardRouteGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading FinanceFlow Dashboard...</p>
          </div>
        </div>
      </DashboardRouteGuard>
    );
  }

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-xl border-r border-slate-200 min-h-screen">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">FinanceFlow</h1>
                  <p className="text-sm text-slate-500">Dashboard</p>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === item.name
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 mt-auto border-t border-slate-200">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Pro Plan</p>
                  <p className="text-xs text-amber-600">Advanced features</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">My Assets</h1>
                <p className="text-slate-600 mt-1">
                  Manage your financial portfolio and track performance
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleEmailToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    emailNotifications
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {emailNotifications ? 'Notifications On' : 'Notifications Off'}
                </button>

                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 rounded-b-xl transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Asset Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {/* Total Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-gradient-to-br from-purple-500 via-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full translate-y-10 -translate-x-10"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Total Balance</p>
                        <p className="text-xs opacity-75">All accounts</p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHideBalance(!hideBalance)}
                      className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 rounded-xl text-sm font-medium backdrop-blur-sm border border-white border-opacity-30 hover:bg-opacity-30 transition-all duration-200"
                    >
                      {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {hideBalance ? 'Show Balance' : 'Hide Balance'}
                    </motion.button>
                  </div>

                  <div className="mb-4">
                    <p className="text-4xl font-bold mb-2">
                      {hideBalance
                        ? '••••••'
                        : `$${financeData.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    </p>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          financeData.monthlyChange >= 0
                            ? 'bg-green-500 bg-opacity-20 text-green-100'
                            : 'bg-red-500 bg-opacity-20 text-red-100'
                        }`}
                      >
                        {financeData.monthlyChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {financeData.monthlyChange >= 0 ? '+' : ''}
                        {financeData.monthlyChange}%
                      </div>
                      <span className="text-sm opacity-90">this month</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-green-300" />
                      <span className="opacity-90">
                        Income:{' '}
                        {hideBalance
                          ? '••••'
                          : `$${(financeData.totalBalance * 0.8).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-300" />
                      <span className="opacity-90">
                        Expenses:{' '}
                        {hideBalance
                          ? '••••'
                          : `$${(financeData.totalBalance * 0.6).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bonus Earnings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <p className="text-sm text-slate-600 mb-1">Bonus Earnings</p>
                <p className="text-2xl font-bold text-slate-800">
                  {hideBalance ? '••••' : `$${financeData.bonusEarnings}`}
                </p>
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8.2% from last month
                </p>
              </motion.div>

              {/* Active Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <p className="text-sm text-slate-600 mb-1">Active Cards</p>
                <p className="text-2xl font-bold text-slate-800">{financeData.activeCards}</p>
                <p className="text-sm text-slate-500 mt-2">Debit & Credit Cards</p>
              </motion.div>
            </div>

            {/* Additional Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Crypto Assets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                    <Bitcoin className="w-6 h-6 text-white" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <p className="text-sm text-slate-600 mb-1">Crypto Assets</p>
                <p className="text-2xl font-bold text-slate-800">{financeData.cryptoAssets}</p>
                <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Portfolio value:{' '}
                  {hideBalance
                    ? '••••'
                    : `$${(financeData.portfolio.BTC * 45000 + financeData.portfolio.ETH * 3000 + financeData.portfolio.USDT).toLocaleString()}`}
                </p>
              </motion.div>

              {/* Portfolio Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <p className="text-sm text-slate-600 mb-1">Portfolio Performance</p>
                <p className="text-2xl font-bold text-slate-800">+24.8%</p>
                <p className="text-sm text-purple-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Annual return
                </p>
              </motion.div>

              {/* Monthly Savings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <p className="text-sm text-slate-600 mb-1">Monthly Savings</p>
                <p className="text-2xl font-bold text-slate-800">
                  {hideBalance ? '••••' : `$${(financeData.totalBalance * 0.15).toFixed(0)}`}
                </p>
                <p className="text-sm text-teal-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Goal: $2,000/month
                </p>
              </motion.div>
            </div>

            {/* Cash Flow Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Cash Flow Analysis</h3>
                    <p className="text-sm text-slate-600">Income vs Expenses trend</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPeriod('daily')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedPeriod === 'daily'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('weekly')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedPeriod === 'weekly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('monthly')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedPeriod === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('yearly')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedPeriod === 'yearly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {financeData.cashFlow.map((item, index) => (
                    <div key={item.month} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium text-slate-600">{item.month}</div>

                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                            style={{ width: `${(item.income / 12000) * 100}%` }}
                          ></div>
                        </div>

                        <div className="w-20 text-right">
                          <p className="text-sm font-semibold text-green-600">
                            {hideBalance ? '••••' : `$${item.income.toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                            style={{ width: `${(item.expenses / 8000) * 100}%` }}
                          ></div>
                        </div>

                        <div className="w-20 text-right">
                          <p className="text-sm font-semibold text-red-600">
                            {hideBalance ? '••••' : `$${item.expenses.toLocaleString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="w-24 text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {hideBalance ? '••••' : `$${item.net.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Expenses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                    <span className="text-sm text-slate-600">Net</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Recent Transactions</h3>
                    <p className="text-sm text-slate-600">Latest activity</p>
                  </div>

                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {financeData.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          transaction.type === 'credit'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {transaction.type === 'credit' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-500">{transaction.category}</p>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              transaction.status === 'completed'
                                ? 'bg-green-500'
                                : transaction.status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                          ></div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}
                          {hideBalance ? '••••' : `$${Math.abs(transaction.amount).toFixed(2)}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Total this month:</span>
                    <span className="font-semibold text-slate-800">
                      {hideBalance
                        ? '••••'
                        : `$${financeData.transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
