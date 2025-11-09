"use client";

import { useState } from "react";
import CryptoWithdrawForm from "@/components/CryptoWithdrawForm";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";

export default function WithdrawCryptoPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWithdrawalSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Withdraw Cryptocurrency
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send your crypto to an external wallet. Withdrawals require admin approval.
            </p>
          </div>

          {/* Security Warning */}
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              ⚠️ Security Warning
            </h2>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span><strong>Double-check the wallet address!</strong> Sending to the wrong address will result in permanent loss of funds.</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span><strong>Withdrawals cannot be reversed!</strong> Once approved by admin, the transaction is final.</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span><strong>Verify the network!</strong> Make sure the destination wallet supports the cryptocurrency you&apos;re sending.</span>
              </li>
            </ul>
          </div>

          {/* How It Works Section */}
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Withdrawals Work
            </h2>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                <span>Select the cryptocurrency you want to withdraw from your balance</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                <span>Enter the amount you wish to withdraw (minimum 0.001)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                <span>Paste your external wallet address (triple-check for accuracy!)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</span>
                <span>Review the withdrawal fee (1.5%) and total amount to be deducted</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">5</span>
                <span>Submit your withdrawal request - crypto is locked immediately</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">6</span>
                <span>Admin reviews and processes your withdrawal (usually within 24 hours)</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">7</span>
                <span>You&apos;ll receive a notification with the transaction hash once completed</span>
              </li>
            </ol>
          </div>

          {/* Withdrawal Form */}
          <CryptoWithdrawForm key={refreshKey} onSuccess={handleWithdrawalSuccess} />

          {/* Additional Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Fees Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Fee Structure
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Network Fee:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">1.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Minimum Withdrawal:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">0.001 crypto</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Processing Time:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">Up to 24 hrs</span>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Having trouble with your withdrawal? Our support team is here to help.
              </p>
              <div className="space-y-2">
                <a
                  href="/crypto/withdrawals"
                  className="block w-full py-2 px-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-center text-sm font-medium transition-colors"
                >
                  View My Withdrawals
                </a>
                <a
                  href="/support"
                  className="block w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-center text-sm font-medium transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>

          {/* Supported Networks */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Supported Networks
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Bitcoin (BTC)</div>
                <div className="text-gray-600 dark:text-gray-400">Bitcoin Network</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Ethereum (ETH)</div>
                <div className="text-gray-600 dark:text-gray-400">Ethereum Mainnet</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Tether (USDT)</div>
                <div className="text-gray-600 dark:text-gray-400">ERC-20 Network</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">Litecoin (LTC)</div>
                <div className="text-gray-600 dark:text-gray-400">Litecoin Network</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
