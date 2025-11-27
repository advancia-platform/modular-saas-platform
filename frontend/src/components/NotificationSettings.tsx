import { useEffect, useState } from 'react';

interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  systemAlerts: boolean;
  rewardAlerts: boolean;
  adminAlerts: boolean;
  withdrawals: boolean;
  complianceAlerts: boolean;
  auditLogs: boolean;
  digestFrequency: 'NONE' | 'DAILY' | 'WEEKLY';
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: false,
    transactionAlerts: true,
    securityAlerts: true,
    systemAlerts: true,
    rewardAlerts: true,
    adminAlerts: true,
    withdrawals: true,
    complianceAlerts: true,
    auditLogs: false,
    digestFrequency: 'NONE'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        setMessage('Failed to load preferences');
      }
    } catch (error) {
      setMessage('Error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setMessage('Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-gray-600">Manage how and when you receive notifications from Advancia Pay</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('success')
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Digest Frequency - Featured Section */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-100 rounded-full p-2 mr-3">📧</span>
            Activity Digest
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How often would you like to receive activity summaries?
            </label>
            <select
              value={preferences.digestFrequency}
              onChange={(e) => updatePreference('digestFrequency', e.target.value)}
              className="block w-full max-w-xs px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="NONE">Never</option>
              <option value="DAILY">Daily Summary</option>
              <option value="WEEKLY">Weekly Summary</option>
            </select>
            <p className="mt-3 text-sm text-gray-600">
              📊 Digest emails include: recent transactions, account activity, rewards earned, and security events.
            </p>
          </div>
        </div>

        {/* Delivery Methods */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Methods</h3>
          <div className="space-y-4">
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">📧 Email Notifications</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">🔔 In-App Notifications</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={(e) => updatePreference('pushEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">📱 Browser Push Notifications</span>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.transactionAlerts}
                onChange={(e) => updatePreference('transactionAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">💳 Transaction Alerts</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.withdrawals}
                onChange={(e) => updatePreference('withdrawals', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">💰 Withdrawal Notifications</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.securityAlerts}
                onChange={(e) => updatePreference('securityAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">🔒 Security Alerts</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.complianceAlerts}
                onChange={(e) => updatePreference('complianceAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">⚖️ Compliance Alerts</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.rewardAlerts}
                onChange={(e) => updatePreference('rewardAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">🎁 Reward Notifications</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.systemAlerts}
                onChange={(e) => updatePreference('systemAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">⚙️ System Updates</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.adminAlerts}
                onChange={(e) => updatePreference('adminAlerts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">👨‍💼 Admin Notifications</span>
            </label>

            <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.auditLogs}
                onChange={(e) => updatePreference('auditLogs', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">📊 Audit Log Alerts</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={loadPreferences}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset
        </button>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
