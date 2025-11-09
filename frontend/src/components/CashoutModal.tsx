"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onCashout: (amount: number, method: string, accountDetails: string) => Promise<void>;
}

export default function CashoutModal({ isOpen, onClose, availableBalance, onCashout }: CashoutModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "paypal" | "crypto">("bank");
  const [accountDetails, setAccountDetails] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const MINIMUM_CASHOUT = 10; // $10 minimum
  const CASHOUT_FEE_PERCENT = 2; // 2% fee
  const TOKEN_TO_USD = 0.10; // 1 token = $0.10

  const usdValue = parseFloat(amount || "0") * TOKEN_TO_USD;
  const fee = usdValue * (CASHOUT_FEE_PERCENT / 100);
  const youReceive = usdValue - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const tokenAmount = parseFloat(amount);
    
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (tokenAmount > availableBalance) {
      setError(`Insufficient balance. Available: ${availableBalance.toFixed(2)} tokens`);
      return;
    }

    if (usdValue < MINIMUM_CASHOUT) {
      setError(`Minimum cashout is $${MINIMUM_CASHOUT.toFixed(2)} (${(MINIMUM_CASHOUT / TOKEN_TO_USD).toFixed(0)} tokens)`);
      return;
    }

    if (!accountDetails.trim()) {
      setError(`Please enter your ${method} account details`);
      return;
    }

    setIsProcessing(true);
    try {
      await onCashout(tokenAmount, method, accountDetails);
      setAmount("");
      setAccountDetails("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Cashout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlaceholder = () => {
    switch (method) {
      case "bank":
        return "Account Number (e.g., 1234567890)";
      case "paypal":
        return "PayPal Email (e.g., you@email.com)";
      case "crypto":
        return "Wallet Address (e.g., 0x...)";
      default:
        return "Account Details";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-full">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Cash Out</h2>
                    <p className="text-green-100 text-sm">Convert tokens to real money</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Available Balance */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                <p className="text-sm text-green-700 font-semibold mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-green-900">
                  {availableBalance.toFixed(2)} <span className="text-lg">ADV</span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  ≈ ${(availableBalance * TOKEN_TO_USD).toFixed(2)} USD
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount to Cash Out
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter tokens amount"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none pr-16 text-lg font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ADV
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toString())}
                  className="mt-2 text-sm text-green-600 hover:text-green-700 font-semibold"
                >
                  Use Max ({availableBalance.toFixed(2)} ADV)
                </button>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["bank", "paypal", "crypto"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`py-3 px-4 rounded-lg font-semibold capitalize transition-all ${
                        method === m
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {method === "bank" ? "Bank Account" : method === "paypal" ? "PayPal Email" : "Crypto Wallet"}
                </label>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>

              {/* Calculation Breakdown */}
              {amount && parseFloat(amount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Amount:</span>
                    <span className="font-semibold text-gray-900">{parseFloat(amount).toFixed(2)} ADV</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USD Value:</span>
                    <span className="font-semibold text-gray-900">${usdValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Processing Fee ({CASHOUT_FEE_PERCENT}%):</span>
                    <span className="font-semibold">-${fee.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-lg font-bold">
                    <span className="text-green-700">You Receive:</span>
                    <span className="text-green-700">${youReceive.toFixed(2)}</span>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* Important Notice */}
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded text-yellow-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Important:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Minimum cashout: ${MINIMUM_CASHOUT.toFixed(2)}</li>
                    <li>Processing time: 1-3 business days</li>
                    <li>{CASHOUT_FEE_PERCENT}% fee applies to all cashouts</li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || !amount || !accountDetails}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Cash Out
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
