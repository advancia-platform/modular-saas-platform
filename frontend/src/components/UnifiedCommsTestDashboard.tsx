'use client';

import axios from 'axios';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface TestResult {
  service: 'SMS' | 'WhatsApp' | 'Telegram';
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: string;
}

export default function UnifiedCommsTestDashboard() {
  const [phoneNumber, setPhoneNumber] = useState('+17174695102');
  const [chatId, setChatId] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from Advancia Pay! 🚀');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const addResult = (
    service: TestResult['service'],
    status: TestResult['status'],
    message: string
  ) => {
    const result: TestResult = {
      service,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults((prev) => [result, ...prev].slice(0, 10));
  };

  const testSMS = async () => {
    setLoading('sms');
    try {
      const response = await axios.post(
        `${API_BASE}/api/sms/send-custom`,
        {
          phoneNumber,
          message: testMessage,
        },
        {
          headers: {
            'x-api-key': 'your-admin-api-key', // Replace with actual key
          },
        }
      );

      if (response.data.success) {
        addResult('SMS', 'success', 'SMS sent successfully!');
        toast.success('SMS sent successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to send SMS';
      addResult('SMS', 'error', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  const testWhatsApp = async () => {
    setLoading('whatsapp');
    try {
      const whatsappNumber = phoneNumber.startsWith('whatsapp:')
        ? phoneNumber
        : `whatsapp:${phoneNumber}`;

      const response = await axios.post(
        `${API_BASE}/api/whatsapp/send-custom`,
        {
          phoneNumber: whatsappNumber,
          message: testMessage,
        },
        {
          headers: {
            'x-api-key': 'your-admin-api-key', // Replace with actual key
          },
        }
      );

      if (response.data.success) {
        addResult('WhatsApp', 'success', 'WhatsApp message sent!');
        toast.success('WhatsApp message sent!');
      } else {
        throw new Error(response.data.error || 'Failed to send WhatsApp');
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message || 'Failed to send WhatsApp message';
      addResult('WhatsApp', 'error', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  const testTelegram = async () => {
    if (!chatId) {
      toast.error('Please enter your Telegram Chat ID');
      return;
    }

    setLoading('telegram');
    try {
      const response = await axios.post(
        `${API_BASE}/api/admin/telegram/send`,
        {
          chatId,
          text: testMessage,
        },
        {
          headers: {
            'x-api-key': 'your-admin-api-key', // Replace with actual key
          },
        }
      );

      if (response.data.ok || response.data.result) {
        addResult('Telegram', 'success', 'Telegram message sent!');
        toast.success('Telegram message sent!');
      } else {
        throw new Error('Failed to send Telegram message');
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message || 'Failed to send Telegram message';
      addResult('Telegram', 'error', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  const testAll = async () => {
    await testSMS();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testWhatsApp();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testTelegram();
  };

  const checkSetup = async () => {
    const loadingToast = toast.loading('Checking service setup...');
    try {
      const [smsRes, whatsappRes, telegramRes] = await Promise.all([
        axios.get(`${API_BASE}/api/sms/business-contact`).catch(() => null),
        axios.get(`${API_BASE}/api/whatsapp/setup-info`).catch(() => null),
        axios.get(`${API_BASE}/api/admin/telegram/setup-info`).catch(() => null),
      ]);

      let setupInfo = '📊 Service Status:\n\n';

      if (smsRes?.data) {
        setupInfo += '✅ SMS: Connected\n';
        setupInfo += `   Phone: ${smsRes.data.businessPhone}\n\n`;
      } else {
        setupInfo += '❌ SMS: Not configured\n\n';
      }

      if (whatsappRes?.data) {
        setupInfo += '✅ WhatsApp: Connected\n';
        setupInfo += `   Number: ${whatsappRes.data.whatsappNumber}\n\n`;
      } else {
        setupInfo += '❌ WhatsApp: Not configured\n\n';
      }

      if (telegramRes?.data) {
        setupInfo += '✅ Telegram: Connected\n';
        setupInfo += `   Bot: ${telegramRes.data.setup.botToken}\n`;
        setupInfo += `   Admin: ${telegramRes.data.setup.adminChatId}\n`;
      } else {
        setupInfo += '❌ Telegram: Not configured\n';
      }

      toast.dismiss(loadingToast);
      toast.success('Setup check complete!');
      alert(setupInfo);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to check setup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            📱 Unified Communications Dashboard
          </h1>
          <p className="text-gray-300">Test SMS, WhatsApp, and Telegram from one place</p>
          <p className="text-sm text-purple-300 mt-2">Business Phone: +1 (717) 469-5102</p>
        </motion.div>

        {/* Setup Check */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6"
        >
          <button
            onClick={checkSetup}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            🔍 Check Service Setup
          </button>
        </motion.div>

        {/* Test Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Test Configuration</h2>

          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number (SMS & WhatsApp)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+17174695102"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Chat ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telegram Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Get from @userinfobot"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Test Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Test Message</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                placeholder="Enter your test message..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* SMS */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={testSMS}
            disabled={loading !== null}
            className="py-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading === 'sms' ? '⏳ Sending...' : '💬 Test SMS'}
          </motion.button>

          {/* WhatsApp */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={testWhatsApp}
            disabled={loading !== null}
            className="py-4 bg-gradient-to-br from-green-400 to-teal-500 text-white rounded-xl font-semibold hover:from-green-500 hover:to-teal-600 transition-all shadow-lg disabled:opacity-50"
          >
            {loading === 'whatsapp' ? '⏳ Sending...' : '📱 Test WhatsApp'}
          </motion.button>

          {/* Telegram */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={testTelegram}
            disabled={loading !== null}
            className="py-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading === 'telegram' ? '⏳ Sending...' : '✈️ Test Telegram'}
          </motion.button>

          {/* Test All */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={testAll}
            disabled={loading !== null}
            className="py-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? '⏳ Testing...' : '🚀 Test All'}
          </motion.button>
        </div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Test Results ({results.length})</h2>

          {results.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No tests run yet. Click a button above to start testing!
            </p>
          ) : (
            <div className="space-y-3">
              {results.map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border ${
                    result.status === 'success'
                      ? 'bg-green-500/20 border-green-500/50'
                      : result.status === 'error'
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-yellow-500/20 border-yellow-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">
                      {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳'}{' '}
                      {result.service}
                    </span>
                    <span className="text-sm text-gray-300">{result.timestamp}</span>
                  </div>
                  <p className="text-gray-200 text-sm">{result.message}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4">📚 Quick Setup Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://console.twilio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl hover:bg-red-500/30 transition-all"
            >
              <div className="text-white font-semibold">🔴 Twilio Console</div>
              <div className="text-sm text-gray-300">SMS & WhatsApp setup</div>
            </a>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl hover:bg-blue-500/30 transition-all"
            >
              <div className="text-white font-semibold">🤖 @BotFather</div>
              <div className="text-sm text-gray-300">Create Telegram bot</div>
            </a>
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-xl hover:bg-purple-500/30 transition-all"
            >
              <div className="text-white font-semibold">ℹ️ @userinfobot</div>
              <div className="text-sm text-gray-300">Get your Chat ID</div>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
