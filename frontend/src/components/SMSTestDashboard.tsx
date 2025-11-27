/**
 * SMS Testing Dashboard
 *
 * Business Number: +1 (717) 469-5102 (Google Voice)
 *
 * Features:
 * - Send verification codes
 * - Send 2FA codes
 * - Test SMS delivery
 * - Validate phone numbers
 * - View business contact info
 */

'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface BusinessContact {
  phoneNumber: string;
  provider: string;
  email: string;
  capabilities: {
    sms: boolean;
    voice: boolean;
    automated: boolean;
  };
  notes: string;
}

const SMSTestDashboard: React.FC = () => {
  const [contact, setContact] = useState<BusinessContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    fetchBusinessContact();
  }, []);

  const fetchBusinessContact = async () => {
    try {
      const response = await fetch('/api/sms/business-contact');
      const data = await response.json();

      if (data.success) {
        setContact(data.contact);
      }
    } catch (error) {
      console.error('Failed to fetch business contact:', error);
      toast.error('Failed to load contact info');
    } finally {
      setLoading(false);
    }
  };

  const sendTestSMS = async () => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/sms/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: phoneNumber || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test SMS sent! Check your phone.');
        if (data.note) {
          toast(data.note, { icon: 'ℹ️', duration: 5000 });
        }
      } else {
        toast.error(data.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Failed to send test SMS:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || !verificationCode) {
      toast.error('Please enter phone number and code');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verification code sent!');
      } else {
        toast.error(data.error || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Failed to send verification code:', error);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const validatePhone = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      const response = await fetch('/api/sms/validate-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult(data);
        toast.success(data.isValid ? 'Valid phone number ✅' : 'Invalid phone number ❌');
      }
    } catch (error: any) {
      console.error('Failed to validate phone:', error);
      toast.error(error.message);
    }
  };

  const generateRandomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    toast.success('Generated 6-digit code');
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-white' : 'text-gray-900'}>Loading SMS dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-green-50 to-blue-100 text-gray-900'} p-8`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              📱 SMS Testing Dashboard
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Test SMS verification and notifications
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Business Contact Info */}
        {contact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mb-6`}
          >
            <h2 className="text-2xl font-bold mb-4">📞 Business Contact</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Phone Number
                </p>
                <p className="text-2xl font-bold text-green-600">{contact.phoneNumber}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Provider
                </p>
                <p className="text-xl font-semibold">{contact.provider}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                <p className="text-lg">{contact.email}</p>
              </div>
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Capabilities
                </p>
                <div className="flex gap-2 mt-1">
                  {contact.capabilities.sms && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      SMS
                    </span>
                  )}
                  {contact.capabilities.voice && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Voice
                    </span>
                  )}
                  {contact.capabilities.automated && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      Automated
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                ℹ️ {contact.notes}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Test */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <h2 className="text-2xl font-bold mb-4">🧪 Quick SMS Test</h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Send a test message to verify SMS integration
            </p>

            <button
              onClick={sendTestSMS}
              disabled={sending}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : '📤 Send Test SMS'}
            </button>

            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This will send a test message to: <br />
              <span className="font-mono font-bold">{contact?.phoneNumber}</span>
            </p>
          </motion.div>

          {/* Phone Validation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <h2 className="text-2xl font-bold mb-4">✓ Validate Phone Number</h2>

            <div className="mb-4">
              <label htmlFor="validatePhone" className="block mb-2 font-semibold">
                Phone Number
              </label>
              <input
                id="validatePhone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+17174695102 or (717) 469-5102"
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:border-green-500 focus:outline-none`}
              />
            </div>

            <button
              onClick={validatePhone}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Validate Format
            </button>

            {validationResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  validationResult.isValid
                    ? darkMode
                      ? 'bg-green-900'
                      : 'bg-green-100'
                    : darkMode
                      ? 'bg-red-900'
                      : 'bg-red-100'
                }`}
              >
                <p className="font-semibold mb-2">
                  {validationResult.isValid ? '✅ Valid' : '❌ Invalid'}
                </p>
                <p className="text-sm">
                  <strong>Original:</strong> {validationResult.original}
                </p>
                <p className="text-sm">
                  <strong>Formatted:</strong> {validationResult.formatted}
                </p>
              </div>
            )}
          </motion.div>

          {/* Send Verification Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <h2 className="text-2xl font-bold mb-4">🔐 Send Verification Code</h2>

            <div className="mb-4">
              <label htmlFor="phoneForCode" className="block mb-2 font-semibold">
                Phone Number
              </label>
              <input
                id="phoneForCode"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+17174695102"
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:border-green-500 focus:outline-none`}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="verifyCode" className="block mb-2 font-semibold">
                6-Digit Code
              </label>
              <div className="flex gap-2">
                <input
                  id="verifyCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-mono text-xl ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:border-green-500 focus:outline-none`}
                />
                <button
                  onClick={generateRandomCode}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  title="Generate random code"
                >
                  🎲
                </button>
              </div>
            </div>

            <button
              onClick={sendVerificationCode}
              disabled={sending}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : '📨 Send Verification Code'}
            </button>
          </motion.div>

          {/* Setup Guide Link */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
          >
            <h2 className="text-2xl font-bold mb-4">📖 Automation Guide</h2>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Want to automate SMS sending? Set up Twilio integration.
            </p>

            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <p className="font-semibold mb-2">Current Status:</p>
              <p className={darkMode ? 'text-blue-300' : 'text-blue-800'}>
                {contact?.capabilities.automated
                  ? '✅ Automated via Twilio'
                  : '⚠️ Manual sending via Google Voice'}
              </p>
            </div>

            <a
              href="/api/sms/setup-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-center font-semibold hover:shadow-lg transition"
            >
              View Setup Guide →
            </a>

            <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-sm font-semibold mb-2">Quick Steps:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Sign up at twilio.com</li>
                <li>Get Account SID & Auth Token</li>
                <li>Add to .env file</li>
                <li>Restart backend</li>
                <li>SMS automated! ✨</li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SMSTestDashboard;
