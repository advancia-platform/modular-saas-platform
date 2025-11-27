/**
 * Virtual Phone Number Manager
 *
 * Free Services for Business:
 * - Google Voice (US only, requires Gmail)
 * - TextNow (US/CA, free with ads)
 * - FreeTone, TextMe, Dingtone
 *
 * Paid Services (Production):
 * - Twilio ($1/month + usage)
 * - Vonage ($0.90/month + usage)
 */

'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface PhoneService {
  name: string;
  url: string;
  description: string;
  features: string[];
  countries: string[];
  setup: string;
  pricing?: string;
  recommended?: boolean;
}

interface SetupStep {
  service: string;
  steps: string[];
  limitations?: string[];
  best_for: string;
  features?: string[];
  pricing?: string;
}

interface BusinessGuide {
  title: string;
  freeOptions: {
    title: string;
    recommended: SetupStep[];
  };
  paidOptions: {
    title: string;
    recommended: SetupStep[];
  };
  integration: {
    title: string;
    steps: string[];
  };
  bestPractices: string[];
}

const VirtualPhoneManager: React.FC = () => {
  const [freeServices, setFreeServices] = useState<PhoneService[]>([]);
  const [premiumServices, setPremiumServices] = useState<PhoneService[]>([]);
  const [guide, setGuide] = useState<BusinessGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedNumber, setGeneratedNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'free' | 'paid' | 'guide'>('free');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);

      const [freeRes, premiumRes, guideRes] = await Promise.all([
        fetch('/api/phone/free-services'),
        fetch('/api/phone/premium-services'),
        fetch('/api/phone/business-setup-guide'),
      ]);

      const freeData = await freeRes.json();
      const premiumData = await premiumRes.json();
      const guideData = await guideRes.json();

      if (freeData.success) setFreeServices(freeData.services);
      if (premiumData.success) setPremiumServices(premiumData.services);
      if (guideData.success) setGuide(guideData.guide);
    } catch (error) {
      console.error('Failed to fetch phone services:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTestNumber = async () => {
    try {
      const response = await fetch('/api/phone/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: 'US' }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedNumber(data.number.number);
      }
    } catch (error) {
      console.error('Failed to generate number:', error);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-white' : 'text-gray-900'}>Loading phone services...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900'} p-8`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📱 Business Phone Numbers
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Get a free or premium virtual number for your business
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['free', 'paid', 'guide'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'free'
                ? '🆓 Free Options'
                : tab === 'paid'
                  ? '💎 Premium'
                  : '📖 Setup Guide'}
            </button>
          ))}
        </div>

        {/* Free Services Tab */}
        {activeTab === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className="text-2xl font-bold mb-4">Free Virtual Phone Services</h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Perfect for starting out, testing, or small businesses on a budget
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {freeServices.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-lg border-2 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                    } hover:shadow-xl transition`}
                  >
                    <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {service.description}
                    </p>

                    <div className="mb-4">
                      <p className="font-semibold mb-2">Features:</p>
                      <ul className="text-sm space-y-1">
                        {service.features.map((feature, i) => (
                          <li key={i} className={darkMode ? 'text-gray-400' : 'text-gray-700'}>
                            ✓ {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-semibold">Countries:</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                        {service.countries.join(', ')}
                      </p>
                    </div>

                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-center font-semibold hover:shadow-lg transition"
                    >
                      Get Started →
                    </a>
                  </motion.div>
                ))}
              </div>

              {/* Test Number Generator */}
              <div
                className={`mt-8 p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50 border-2 border-yellow-300'}`}
              >
                <h3 className="text-xl font-bold mb-4">🧪 Generate Test Number</h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Generate a test phone number for development (not for production use)
                </p>
                <button
                  onClick={generateTestNumber}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Generate Test Number
                </button>
                {generatedNumber && (
                  <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                    <p className="font-mono text-xl font-bold text-green-800 dark:text-green-200">
                      {generatedNumber}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      ⚠️ For development only. Use a real service for production.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Premium Services Tab */}
        {activeTab === 'paid' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className="text-2xl font-bold mb-4">Premium Phone Services</h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Reliable, programmable, and scalable for production businesses
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {premiumServices.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-lg border-2 ${
                      service.recommended
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-300'
                    } hover:shadow-xl transition relative`}
                  >
                    {service.recommended && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                        RECOMMENDED
                      </div>
                    )}

                    <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                    <p className="text-lg font-semibold text-green-600 mb-4">{service.pricing}</p>

                    <div className="mb-4">
                      <p className="font-semibold mb-2">Features:</p>
                      <ul className="text-sm space-y-1">
                        {service.features.map((feature, i) => (
                          <li key={i} className={darkMode ? 'text-gray-400' : 'text-gray-700'}>
                            ✓ {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-center font-semibold hover:shadow-lg transition"
                    >
                      Sign Up →
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Setup Guide Tab */}
        {activeTab === 'guide' && guide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className="text-3xl font-bold mb-6">{guide.title}</h2>

              {/* Free Options Setup */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">{guide.freeOptions.title}</h3>
                {guide.freeOptions.recommended.map((option, index) => (
                  <div
                    key={index}
                    className={`mb-6 p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}
                  >
                    <h4 className="text-xl font-bold mb-3">{option.service}</h4>
                    <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      <strong>Best for:</strong> {option.best_for}
                    </p>
                    <div className="mb-4">
                      <p className="font-semibold mb-2">Setup Steps:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        {option.steps.map((step, i) => (
                          <li
                            key={i}
                            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                          >
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    {option.limitations && (
                      <div
                        className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}
                      >
                        <p className="font-semibold mb-2">⚠️ Limitations:</p>
                        <ul className="text-sm space-y-1">
                          {option.limitations.map((limitation, i) => (
                            <li
                              key={i}
                              className={darkMode ? 'text-yellow-300' : 'text-yellow-800'}
                            >
                              • {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Paid Options Setup */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">{guide.paidOptions.title}</h3>
                {guide.paidOptions.recommended.map((option, index) => (
                  <div
                    key={index}
                    className={`mb-6 p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}
                  >
                    <h4 className="text-xl font-bold mb-3">{option.service}</h4>
                    <p className="text-lg font-semibold text-green-600 mb-3">{option.pricing}</p>
                    <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                      <strong>Best for:</strong> {option.best_for}
                    </p>
                    <div className="mb-4">
                      <p className="font-semibold mb-2">Setup Steps:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        {option.steps.map((step, i) => (
                          <li
                            key={i}
                            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}
                          >
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>

              {/* Integration Guide */}
              <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                <h3 className="text-2xl font-bold mb-4">{guide.integration.title}</h3>
                <ol className="list-decimal list-inside space-y-3">
                  {guide.integration.steps.map((step, i) => (
                    <li key={i} className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Best Practices */}
              <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                <h3 className="text-2xl font-bold mb-4">📋 Best Practices</h3>
                <ul className="space-y-2">
                  {guide.bestPractices.map((practice, i) => (
                    <li
                      key={i}
                      className={`flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}
                    >
                      <span className="mr-2">✓</span>
                      <span>{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VirtualPhoneManager;
