import apiClient from '@/utils/apiClient';
import React, { useEffect, useState } from 'react';

interface SystemSettings {
  maintenanceMode: boolean;
  version: string;
  lastUpdated: string;
  environment: string;
  uptime: number;
  databaseStatus: string;
  redisStatus: string;
  totalUsers: number;
  activeUsers: number;
  systemLoad: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  scheduledStart?: string;
  estimatedEnd?: string;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'System is under maintenance. Please check back later.',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, maintenanceRes] = await Promise.all([
        apiClient.get('/admin/system/status'),
        apiClient.get('/admin/system/maintenance'),
      ]);

      setSettings(settingsRes.data);
      setMaintenance(maintenanceRes.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch system settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceMode = async () => {
    try {
      setSaving(true);
      await apiClient.put('/admin/system/maintenance', maintenance);
      setError('');
      await fetchSettings(); // Refresh the settings
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update maintenance settings');
    } finally {
      setSaving(false);
    }
  };

  const restartSystem = async () => {
    if (
      !confirm(
        'Are you sure you want to restart the system? This will temporarily interrupt service.'
      )
    ) {
      return;
    }

    try {
      await apiClient.post('/admin/system/restart');
      alert('System restart initiated. The system will be back online shortly.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to restart system');
    }
  };

  const clearCache = async () => {
    try {
      await apiClient.post('/admin/system/clear-cache');
      alert('System cache cleared successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear cache');
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading system settings...</span>
        </div>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          Failed to load system settings. Please try again.
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
          <p className="text-sm text-gray-600 mt-1">Current system health and metrics</p>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Version</dt>
                    <dd className="text-lg font-medium text-gray-900">{settings.version}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      settings.environment === 'production' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Environment</dt>
                    <dd className="text-lg font-medium text-gray-900 capitalize">
                      {settings.environment}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Uptime</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Math.floor(settings.uptime / 3600)}h
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {settings.activeUsers}/{settings.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* System Load */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Load</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>CPU Usage</span>
                  <span>{settings.systemLoad.cpu}%</span>
                </div>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${settings.systemLoad.cpu}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        settings.systemLoad.cpu > 80
                          ? 'bg-red-500'
                          : settings.systemLoad.cpu > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Memory Usage</span>
                  <span>{settings.systemLoad.memory}%</span>
                </div>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${settings.systemLoad.memory}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        settings.systemLoad.memory > 80
                          ? 'bg-red-500'
                          : settings.systemLoad.memory > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Disk Usage</span>
                  <span>{settings.systemLoad.disk}%</span>
                </div>
                <div className="mt-1 relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${settings.systemLoad.disk}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        settings.systemLoad.disk > 80
                          ? 'bg-red-500'
                          : settings.systemLoad.disk > 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maintenance Mode */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Mode</h2>
          <p className="text-sm text-gray-600 mt-1">Control system maintenance settings</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenance-enabled"
                checked={maintenance.enabled}
                onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="maintenance-enabled" className="ml-2 block text-sm text-gray-900">
                Enable Maintenance Mode
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Maintenance Message</label>
              <textarea
                value={maintenance.message}
                onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the message to display to users during maintenance"
              />
            </div>

            <button
              onClick={updateMaintenanceMode}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Maintenance Settings'}
            </button>
          </div>
        </div>
      </section>

      {/* System Actions */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Actions</h2>
          <p className="text-sm text-gray-600 mt-1">Perform system maintenance tasks</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Clear System Cache</h3>
                <p className="text-sm text-gray-500">
                  Clear all cached data to improve performance
                </p>
              </div>
              <button
                onClick={clearCache}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Clear Cache
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Restart System</h3>
                <p className="text-sm text-gray-500">
                  Restart all system services (causes temporary downtime)
                </p>
              </div>
              <button
                onClick={restartSystem}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Restart System
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Refresh Status</h3>
                <p className="text-sm text-gray-500">Refresh all system status information</p>
              </div>
              <button
                onClick={fetchSettings}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SystemSettings;
