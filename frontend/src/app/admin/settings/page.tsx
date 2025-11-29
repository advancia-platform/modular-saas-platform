'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bell,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Key,
  Save,
  Settings,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ApiKeyConfig {
  name: string;
  envKey: string;
  value: string;
  isSecret: boolean;
  provider: 'stripe' | 'cryptomus' | 'nowpayments' | 'alchemypay' | 'other';
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'security' | 'notifications'>(
    'general'
  );

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Advancia Pay Ledger',
    supportEmail: 'support@advancia.com',
    maintenanceMode: false,
    debugMode: false,
  });

  // Payment API keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([
    {
      name: 'Stripe Secret Key',
      envKey: 'STRIPE_SECRET_KEY',
      value: 'sk_live_***************',
      isSecret: true,
      provider: 'stripe',
    },
    {
      name: 'Stripe Webhook Secret',
      envKey: 'STRIPE_WEBHOOK_SECRET',
      value: 'whsec_***************',
      isSecret: true,
      provider: 'stripe',
    },
    {
      name: 'Stripe Publishable Key',
      envKey: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      value: 'pk_live_***************',
      isSecret: false,
      provider: 'stripe',
    },
    {
      name: 'Cryptomus API Key',
      envKey: 'CRYPTOMUS_API_KEY',
      value: '***************',
      isSecret: true,
      provider: 'cryptomus',
    },
    {
      name: 'Cryptomus Merchant ID',
      envKey: 'CRYPTOMUS_MERCHANT_ID',
      value: 'merchant_***',
      isSecret: false,
      provider: 'cryptomus',
    },
    {
      name: 'NOWPayments API Key',
      envKey: 'NOWPAYMENTS_API_KEY',
      value: '***************',
      isSecret: true,
      provider: 'nowpayments',
    },
    {
      name: 'NOWPayments IPN Secret',
      envKey: 'NOWPAYMENTS_IPN_SECRET',
      value: '***************',
      isSecret: true,
      provider: 'nowpayments',
    },
    {
      name: 'AlchemyPay App ID',
      envKey: 'ALCHEMYPAY_APP_ID',
      value: 'app_***',
      isSecret: false,
      provider: 'alchemypay',
    },
    {
      name: 'AlchemyPay Secret Key',
      envKey: 'ALCHEMYPAY_SECRET_KEY',
      value: '***************',
      isSecret: true,
      provider: 'alchemypay',
    },
  ]);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    require2FA: true,
    ipRestriction: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    forcePasswordChange: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save settings to API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Show success toast
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSecretVisibility = (envKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [envKey]: !prev[envKey] }));
  };

  const copyToClipboard = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const providerColors: Record<string, string> = {
    stripe: 'border-blue-500/30 bg-blue-500/10',
    cryptomus: 'border-green-500/30 bg-green-500/10',
    nowpayments: 'border-purple-500/30 bg-purple-500/10',
    alchemypay: 'border-orange-500/30 bg-orange-500/10',
    other: 'border-gray-500/30 bg-gray-500/10',
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'payments', label: 'Payment APIs', icon: Key },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-purple-400" />
                Settings
              </h1>
              <p className="text-gray-400 mt-1">
                Configure system preferences and API integrations
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700/50 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">General Settings</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.platformName}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({ ...prev, platformName: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({ ...prev, supportEmail: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Maintenance Mode</p>
                      <p className="text-sm text-gray-400">Disable access for non-admin users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generalSettings.maintenanceMode}
                        onChange={(e) =>
                          setGeneralSettings((prev) => ({
                            ...prev,
                            maintenanceMode: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Debug Mode</p>
                      <p className="text-sm text-gray-400">Enable verbose logging</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generalSettings.debugMode}
                        onChange={(e) =>
                          setGeneralSettings((prev) => ({ ...prev, debugMode: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Payment API Keys */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Security Notice</p>
                    <p className="text-sm text-yellow-400/80">
                      API keys are stored securely and masked. Changes here update environment
                      variables. Restart the server after updating keys.
                    </p>
                  </div>
                </div>

                {['stripe', 'cryptomus', 'nowpayments', 'alchemypay'].map((provider) => {
                  const providerKeys = apiKeys.filter((k) => k.provider === provider);
                  return (
                    <div
                      key={provider}
                      className={cn(
                        'bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6',
                        providerColors[provider]
                      )}
                    >
                      <h3 className="text-lg font-bold text-white capitalize mb-4">
                        {provider === 'nowpayments'
                          ? 'NOWPayments'
                          : provider === 'alchemypay'
                            ? 'AlchemyPay'
                            : provider}
                      </h3>
                      <div className="space-y-4">
                        {providerKeys.map((key) => (
                          <div key={key.envKey}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {key.name}
                              <span className="ml-2 text-xs text-gray-500">({key.envKey})</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input
                                  type={showSecrets[key.envKey] ? 'text' : 'password'}
                                  value={key.value}
                                  onChange={(e) => {
                                    setApiKeys((prev) =>
                                      prev.map((k) =>
                                        k.envKey === key.envKey
                                          ? { ...k, value: e.target.value }
                                          : k
                                      )
                                    );
                                  }}
                                  className="w-full px-4 py-2.5 pr-20 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                  <button
                                    onClick={() => toggleSecretVisibility(key.envKey)}
                                    className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                                    title={showSecrets[key.envKey] ? 'Hide' : 'Show'}
                                  >
                                    {showSecrets[key.envKey] ? (
                                      <EyeOff className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(key.value, key.envKey)}
                                    className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                                    title="Copy"
                                  >
                                    {copiedKey === key.envKey ? (
                                      <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Security Settings</h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Require 2FA for Admin Login</p>
                      <p className="text-sm text-gray-400">Enforce two-factor authentication</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.require2FA}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({ ...prev, require2FA: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">IP Restriction</p>
                      <p className="text-sm text-gray-400">Limit admin access to whitelisted IPs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.ipRestriction}
                        onChange={(e) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            ipRestriction: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          sessionTimeout: parseInt(e.target.value) || 30,
                        }))
                      }
                      min={5}
                      max={120}
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          maxLoginAttempts: parseInt(e.target.value) || 5,
                        }))
                      }
                      min={3}
                      max={10}
                      className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-xl font-bold text-white">Notification Settings</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'New user registration', enabled: true },
                    { label: 'New payment received', enabled: true },
                    { label: 'Withdrawal requests', enabled: true },
                    { label: 'Failed transactions', enabled: true },
                    { label: 'Security alerts', enabled: true },
                    { label: 'Daily summary report', enabled: false },
                    { label: 'Weekly analytics report', enabled: false },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <p className="text-white font-medium">{item.label}</p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={item.enabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
