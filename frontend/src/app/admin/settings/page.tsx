"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import RequireRole from "@/components/RequireRole";
import adminApi from "@/lib/adminApi";

interface AdminSettings {
  id: string;
  crypto: {
    btcAddress: string;
    ethAddress: string;
    usdtAddress: string;
    ltcAddress: string;
    otherAddresses: string;
  };
  exchangeRates: {
    btc: string;
    eth: string;
    usdt: string;
  };
  fees: {
    processingFeePercent: string;
    minPurchaseAmount: string;
    debitCardPriceUSD: string;
  };
  system: {
    maintenanceMode: boolean;
    rateLimitPerMinute: number;
    maxFileUploadMB: number;
  };
  updatedAt: string;
}

type Tab = "Crypto" | "Fees" | "Exchange Rates" | "System";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Crypto");

  // Form state
  const [formData, setFormData] = useState({
    crypto: {
      btcAddress: "",
      ethAddress: "",
      usdtAddress: "",
      ltcAddress: "",
      otherAddresses: "",
    },
    exchangeRates: {
      btc: "",
      eth: "",
      usdt: "",
    },
    fees: {
      processingFeePercent: "",
      minPurchaseAmount: "",
      debitCardPriceUSD: "",
    },
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get<AdminSettings>("/api/admin/settings");
      setSettings(response.data);
      setFormData({
        crypto: response.data.crypto,
        exchangeRates: response.data.exchangeRates,
        fees: response.data.fees,
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.patch("/api/admin/settings", formData);
      toast.success("Settings saved successfully");
      await fetchSettings();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RequireRole roles={["ADMIN"]}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole roles={["ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure system parameters and platform settings
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                } text-white shadow-md`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
            {settings && (
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </p>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-xl shadow-md p-2 flex gap-2"
          >
            {(["Crypto", "Fees", "Exchange Rates", "System"] as Tab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  aria-label={`Switch to ${tab} tab`}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </motion.div>

          {/* Tab Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {activeTab} Settings
              </h2>
            </div>
            <div className="p-6">
              {activeTab === "Crypto" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bitcoin (BTC) Address
                    </label>
                    <input
                      type="text"
                      value={formData.crypto.btcAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          crypto: {
                            ...formData.crypto,
                            btcAddress: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter BTC address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ethereum (ETH) Address
                    </label>
                    <input
                      type="text"
                      value={formData.crypto.ethAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          crypto: {
                            ...formData.crypto,
                            ethAddress: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter ETH address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      USDT Address
                    </label>
                    <input
                      type="text"
                      value={formData.crypto.usdtAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          crypto: {
                            ...formData.crypto,
                            usdtAddress: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter USDT address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Litecoin (LTC) Address
                    </label>
                    <input
                      type="text"
                      value={formData.crypto.ltcAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          crypto: {
                            ...formData.crypto,
                            ltcAddress: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter LTC address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Addresses (JSON format)
                    </label>
                    <textarea
                      value={formData.crypto.otherAddresses}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          crypto: {
                            ...formData.crypto,
                            otherAddresses: e.target.value,
                          },
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder='{"XRP": "rAddress...", "DOT": "1Address..."}'
                    />
                  </div>
                </div>
              )}

              {activeTab === "Fees" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Processing Fee Percent
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      aria-label="Processing fee percent"
                      value={formData.fees.processingFeePercent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fees: {
                            ...formData.fees,
                            processingFeePercent: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Percentage fee applied to transactions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Purchase Amount (USD)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      aria-label="Minimum purchase amount"
                      value={formData.fees.minPurchaseAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fees: {
                            ...formData.fees,
                            minPurchaseAmount: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum amount required for purchases
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Debit Card Price (USD)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      aria-label="Debit card price"
                      value={formData.fees.debitCardPriceUSD}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fees: {
                            ...formData.fees,
                            debitCardPriceUSD: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Price for virtual debit card issuance
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "Exchange Rates" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Exchange rates should be updated regularly. Consider
                      integrating with a real-time price API.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bitcoin (BTC) Rate (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.exchangeRates.btc}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exchangeRates: {
                            ...formData.exchangeRates,
                            btc: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 43500.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ethereum (ETH) Rate (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.exchangeRates.eth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exchangeRates: {
                            ...formData.exchangeRates,
                            eth: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 2300.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      USDT Rate (USD)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={formData.exchangeRates.usdt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exchangeRates: {
                            ...formData.exchangeRates,
                            usdt: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 1.00"
                    />
                  </div>
                </div>
              )}

              {activeTab === "System" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      ℹ️ System settings are currently read-only. Contact
                      development team to modify these values.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          settings?.system.maintenanceMode
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {settings?.system.maintenanceMode
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit Per Minute
                    </label>
                    <p className="text-2xl font-bold text-gray-900">
                      {settings?.system.rateLimitPerMinute}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum API requests per minute per IP
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max File Upload Size
                    </label>
                    <p className="text-2xl font-bold text-gray-900">
                      {settings?.system.maxFileUploadMB} MB
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum file size for uploads (documents, images)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </RequireRole>
  );
}
