import React from 'react';
import SystemSettings from './SystemSettings';
import UserManagement from './UserManagement';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'system', label: 'System Settings', icon: '⚙️' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💰' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'users':
        return <UserManagement />;
      case 'system':
        return <SystemSettings />;
      case 'withdrawals':
        return <WithdrawalsTab />;
      case 'monitoring':
        return <MonitoringTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive system administration and monitoring
          </p>
        </div>

        <nav className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
      </main>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">1,234</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Withdrawals</p>
                <p className="text-2xl font-bold text-green-900">567</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">23</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">System Health</p>
                <p className="text-2xl font-bold text-purple-900">98%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                User john@example.com created withdrawal request
              </span>
              <span className="text-xs text-gray-400">2 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">System backup completed successfully</span>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Rate limit triggered for IP 192.168.1.100
              </span>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-red-700">High CPU usage detected (85%)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-700">Low disk space warning (80% full)</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Withdrawals Tab Component
const WithdrawalsTab: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdrawal Management</h2>
      <p className="text-gray-600">
        NOWPayments withdrawal system is integrated and ready. Use the existing withdrawal
        management page at <code className="bg-gray-100 px-2 py-1 rounded">/admin/withdrawals</code>{' '}
        for full functionality.
      </p>
      <div className="mt-4">
        <a
          href="/admin/withdrawals"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Go to Withdrawals Page
        </a>
      </div>
    </div>
  );
};

// Monitoring Tab Component
const MonitoringTab: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">System Monitoring</h2>
      <p className="text-gray-600">
        Comprehensive monitoring tools are available. Use the existing monitoring page at{' '}
        <code className="bg-gray-100 px-2 py-1 rounded">/admin/monitoring</code> for detailed
        analytics.
      </p>
      <div className="mt-4">
        <a
          href="/admin/monitoring"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Go to Monitoring Page
        </a>
      </div>
    </div>
  );
};

export default AdminDashboard;
