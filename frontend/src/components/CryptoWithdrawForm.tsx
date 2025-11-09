"use client";

import { useState, useEffect } from "react";
import LiveCryptoPrice from "./LiveCryptoPrice";

interface CryptoWithdrawFormProps {
  onSuccess?: () => void;
}

interface TokenBalance {
  tokenType: string;
  balance: number;
}

interface WithdrawalDetails {
  id: string;
  cryptoType: string;
  amount: number;
  walletAddress: string;
  fee: number;
  totalAmount: number;
}

export default function CryptoWithdrawForm({ onSuccess }: CryptoWithdrawFormProps) {
  const [cryptoType, setCryptoType] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [withdrawalDetails, setWithdrawalDetails] = useState<WithdrawalDetails | null>(null);

  const withdrawalFee = 1.5; // 1.5%
  const minWithdrawal = 0.001;

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`/api/tokens/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch balances");
      }

      const data = await response.json();
      setBalances(data);
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  const getCurrentBalance = () => {
    const balance = balances.find((b) => b.tokenType === cryptoType);
    return balance?.balance || 0;
  };

  const calculateAmounts = () => {
    const withdrawAmount = parseFloat(amount) || 0;
    const fee = (withdrawAmount * withdrawalFee) / 100;
    const total = withdrawAmount + fee;
    const usdValue = currentPrice > 0 ? withdrawAmount * currentPrice : 0;

    return { fee, total, usdValue };
  };

  const { fee, total, usdValue } = calculateAmounts();
  const currentBalance = getCurrentBalance();
  const hasInsufficientBalance = total > currentBalance;

  const getAddressPlaceholder = () => {
    switch (cryptoType) {
      case "BTC":
        return "bc1q... or 1A1z... or 3J98...";
      case "ETH":
      case "USDT":
        return "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      case "LTC":
        return "ltc1q... or LTC1...";
      default:
        return "Enter wallet address";
    }
  };

  const validateAddress = (address: string) => {
    setAddressError("");
    
    if (!address || address.trim().length === 0) {
      return;
    }

    const trimmed = address.trim();

    // Basic format validation
    switch (cryptoType) {
      case "BTC":
        if (!/(^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$)|(^bc1[a-z0-9]{39,87}$)/.test(trimmed)) {
          setAddressError("Invalid Bitcoin address format");
        }
        break;
      case "ETH":
      case "USDT":
        if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
          setAddressError("Invalid Ethereum address format");
        }
        break;
      case "LTC":
        if (!/(^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$)|(^ltc1[a-z0-9]{39,87}$)/.test(trimmed)) {
          setAddressError("Invalid Litecoin address format");
        }
        break;
    }
  };

  const handleAddressChange = (newAddress: string) => {
    setWalletAddress(newAddress);
    validateAddress(newAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount < minWithdrawal) {
      setError(`Minimum withdrawal amount is ${minWithdrawal} ${cryptoType}`);
      return;
    }

    if (hasInsufficientBalance) {
      setError(`Insufficient ${cryptoType} balance`);
      return;
    }

    if (!walletAddress.trim()) {
      setError("Please enter a valid wallet address");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/crypto/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cryptoType,
          amount: withdrawAmount,
          walletAddress: walletAddress.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create withdrawal request");
      }

      setSuccess(true);
      setWithdrawalDetails({
        id: data.id,
        cryptoType: data.cryptoType,
        amount: data.amount,
        walletAddress: data.walletAddress,
        fee: data.fee,
        totalAmount: data.totalAmount,
      });
      setAmount("");
      setWalletAddress("");
      fetchBalances(); // Refresh balances

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create withdrawal request";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Message */}
      {success && withdrawalDetails && (
        <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Withdrawal Request Created! 🎉
              </h3>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <p><strong>Request ID:</strong> {withdrawalDetails.id}</p>
                <p><strong>Amount:</strong> {withdrawalDetails.amount.toFixed(8)} {withdrawalDetails.cryptoType}</p>
                <p><strong>Fee:</strong> {withdrawalDetails.fee.toFixed(8)} {withdrawalDetails.cryptoType}</p>
                <p><strong>Total:</strong> {withdrawalDetails.totalAmount.toFixed(8)} {withdrawalDetails.cryptoType}</p>
                <p><strong>Destination:</strong> <code className="text-xs break-all">{withdrawalDetails.walletAddress}</code></p>
                <p><strong>Status:</strong> <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-semibold">PENDING</span></p>
              </div>
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your crypto has been locked and is pending admin approval. You&apos;ll be notified once the withdrawal is processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        {/* Crypto Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Cryptocurrency
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["BTC", "ETH", "USDT", "LTC"].map((crypto) => {
              const balance = balances.find((b) => b.tokenType === crypto);
              return (
                <button
                  key={crypto}
                  type="button"
                  onClick={() => setCryptoType(crypto)}
                  disabled={loadingBalances}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    cryptoType === crypto
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{crypto}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Balance: {loadingBalances ? "..." : (balance?.balance.toFixed(8) || "0.00000000")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Price Display */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current {cryptoType} Price:</div>
          <LiveCryptoPrice cryptoType={cryptoType} onPriceUpdate={setCurrentPrice} />
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Available Balance: <span className="font-bold text-gray-900 dark:text-white">{currentBalance.toFixed(8)} {cryptoType}</span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Withdrawal Amount ({cryptoType})
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${minWithdrawal}`}
              step="0.00000001"
              min={minWithdrawal}
              max={currentBalance}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setAmount((currentBalance * 0.99).toFixed(8))}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
            >
              Max
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum: {minWithdrawal} {cryptoType} | Available: {currentBalance.toFixed(8)} {cryptoType}
          </p>
        </div>

        {/* Wallet Address Input */}
        <div>
          <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Destination Wallet Address
          </label>
          <input
            type="text"
            id="walletAddress"
            value={walletAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={getAddressPlaceholder()}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              addressError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            required
          />
          {addressError ? (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {addressError}
            </p>
          ) : (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Double-check the address! Withdrawals cannot be reversed.
            </p>
          )}
        </div>

        {/* Calculation Summary */}
        {amount && parseFloat(amount) >= minWithdrawal && (
          <div className={`p-4 rounded-lg border ${hasInsufficientBalance ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${hasInsufficientBalance ? 'text-red-900 dark:text-red-100' : 'text-indigo-900 dark:text-indigo-100'}`}>
              Withdrawal Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Withdrawal Amount:</span>
                <span className="font-medium">{parseFloat(amount).toFixed(8)} {cryptoType}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Network Fee ({withdrawalFee}%):</span>
                <span className="font-medium">{fee.toFixed(8)} {cryptoType}</span>
              </div>
              <div className="flex justify-between text-gray-900 dark:text-white font-semibold pt-2 border-t border-gray-300 dark:border-gray-600">
                <span>Total Deducted:</span>
                <span>{total.toFixed(8)} {cryptoType}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
                <span>Estimated USD Value:</span>
                <span>${usdValue.toFixed(2)}</span>
              </div>
              {hasInsufficientBalance && (
                <div className="pt-2 border-t border-red-300 dark:border-red-700">
                  <p className="text-red-800 dark:text-red-200 text-xs font-semibold">
                    ⚠️ Insufficient balance! You need {total.toFixed(8)} {cryptoType} but only have {currentBalance.toFixed(8)} {cryptoType}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !amount || !walletAddress || parseFloat(amount) < minWithdrawal || hasInsufficientBalance || !!addressError}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Withdraw ${cryptoType}`
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Your crypto will be locked immediately. Withdrawal requires admin approval.
        </p>
      </form>
    </div>
  );
}
