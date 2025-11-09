"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";
import { ethers } from "ethers";
import { Toaster, toast } from "react-hot-toast";

interface WithdrawalEstimate {
  gasLimit: number;
  gasPriceGwei: number;
  estimatedCostEth: number;
  totalCostEth: number;
}

export default function EthWithdrawPage() {
  const router = useRouter();
  
  // Form state
  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  
  // User data
  const [userBalance, setUserBalance] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Validation
  const [addressError, setAddressError] = useState("");
  const [amountError, setAmountError] = useState("");
  
  // Estimate
  const [estimate, setEstimate] = useState<WithdrawalEstimate | null>(null);
  
  // Success
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetchUserBalance();
    fetchEthPrice();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await response.json(); // userData for future use
        // Mock balance for demo - in production, fetch from blockchain
        setUserBalance(2.5); // Demo: 2.5 ETH
        
        // In production, fetch real balance:
        // const userData = await response.json();
        // if (userData.ethWalletAddress) {
        //   const balanceResponse = await fetch(`${API_URL}/api/eth/balance/${userData.ethWalletAddress}`);
        //   const balanceData = await balanceResponse.json();
        //   setUserBalance(balanceData.balance);
        // }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    }
  };

  const validateAddress = (address: string): boolean => {
    if (!address) {
      setAddressError("Destination address is required");
      return false;
    }

    if (!ethers.isAddress(address)) {
      setAddressError("Invalid Ethereum address");
      return false;
    }

    setAddressError("");
    return true;
  };

  const validateAmount = (value: string): boolean => {
    if (!value) {
      setAmountError("Amount is required");
      return false;
    }

    const numAmount = parseFloat(value);

    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Amount must be greater than 0");
      return false;
    }

    if (numAmount < 0.001) {
      setAmountError("Minimum withdrawal is 0.001 ETH");
      return false;
    }

    if (numAmount > userBalance) {
      setAmountError("Insufficient balance");
      return false;
    }

    setAmountError("");
    return true;
  };

  const estimateWithdrawal = async () => {
    if (!validateAddress(destinationAddress) || !validateAmount(amount)) {
      return;
    }

    setEstimating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/eth/estimate-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAddress: destinationAddress,
          amountEth: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || "Failed to estimate gas cost";
        throw new Error(message);
      }

      const data = await response.json();
      
      setEstimate({
        gasLimit: data.gasLimit,
        gasPriceGwei: data.gasPriceGwei,
        estimatedCostEth: data.estimatedCostEth,
        totalCostEth: parseFloat(amount) + data.estimatedCostEth,
      });
      toast.success("Gas estimate ready");
    } catch (error) {
      console.error("Error estimating withdrawal:", error);
      toast.error((error as Error).message || "Failed to estimate gas cost");
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAddress(destinationAddress) || !validateAmount(amount)) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const confirmWithdrawal = async () => {
    setSubmitting(true);
    setShowConfirmation(false);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await fetch(`${API_URL}/api/eth/withdrawal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          toAddress: destinationAddress,
          amountEth: parseFloat(amount),
          note: note || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit withdrawal");
      }

      const data = await response.json();
      
      // Show success
      setTxHash(data.txHash || "pending");
      setWithdrawalSuccess(true);
      toast.success("Withdrawal submitted for processing");
      
      // Reset form
      setDestinationAddress("");
      setAmount("");
      setNote("");
      setEstimate(null);
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error((error as Error).message || "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const setMaxAmount = () => {
    // Reserve some ETH for gas fees (estimate 0.005 ETH)
    const maxWithdrawable = Math.max(0, userBalance - 0.005);
    setAmount(maxWithdrawable.toString());
    validateAmount(maxWithdrawable.toString());
  };

  if (loading) {
    return (
      <DashboardRouteGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardRouteGuard>
    );
  }

  if (withdrawalSuccess) {
    return (
      <DashboardRouteGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto px-4 py-16">
            <Toaster position="top-right" />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Withdrawal Submitted!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your ETH withdrawal has been submitted and is being processed.
              </p>

              {txHash && txHash !== "pending" && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Transaction Hash:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {txHash}
                    </code>
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setWithdrawalSuccess(false);
                    setTxHash("");
                  }}
                  className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Make Another Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardRouteGuard>
    );
  }

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Toaster position="top-right" />
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Withdraw Ethereum (ETH)
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send ETH from your account to any Ethereum address
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Withdrawal Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Destination Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Destination Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => {
                        setDestinationAddress(e.target.value);
                        if (addressError) validateAddress(e.target.value);
                      }}
                      onBlur={() => validateAddress(destinationAddress)}
                      placeholder="0x..."
                      className={`w-full px-4 py-3 rounded-lg border ${
                        addressError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                      } dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent transition-colors`}
                    />
                    {addressError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{addressError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter the Ethereum wallet address where you want to send ETH
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount (ETH) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={setMaxAmount}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                      >
                        Max
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          if (amountError) validateAmount(e.target.value);
                        }}
                        onBlur={() => validateAmount(amount)}
                        placeholder="0.00"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          amountError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                        } dark:bg-gray-700 dark:text-white focus:ring-2 focus:border-transparent transition-colors`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        ETH
                      </div>
                    </div>
                    {amountError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{amountError}</p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {amount && ethPrice ? (
                          <>≈ ${(parseFloat(amount) * ethPrice).toFixed(2)} USD</>
                        ) : (
                          <span className="invisible">placeholder</span>
                        )}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Available: {userBalance.toFixed(4)} ETH
                      </span>
                    </div>
                  </div>

                  {/* Note (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note for your records..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>

                  {/* Estimate Gas */}
                  <div>
                    <button
                      type="button"
                      onClick={estimateWithdrawal}
                      disabled={estimating || !destinationAddress || !amount || !!addressError || !!amountError}
                      className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      {estimating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Estimating...
                        </>
                      ) : (
                        "Estimate Gas Cost"
                      )}
                    </button>
                  </div>

                  {/* Gas Estimate Display */}
                  {estimate && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
                        Transaction Estimate
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-300">Amount:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-200">
                            {amount} ETH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-300">Gas Price:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-200">
                            {estimate.gasPriceGwei.toFixed(2)} Gwei
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-300">Est. Gas Fee:</span>
                          <span className="font-medium text-blue-900 dark:text-blue-200">
                            {estimate.estimatedCostEth.toFixed(6)} ETH
                          </span>
                        </div>
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between">
                          <span className="font-semibold text-blue-900 dark:text-blue-100">Total:</span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {estimate.totalCostEth.toFixed(6)} ETH
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                          Important
                        </h4>
                        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                          <li>• Double-check the destination address</li>
                          <li>• Withdrawals cannot be reversed</li>
                          <li>• Processing time: 3-5 minutes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !destinationAddress || !amount || !!addressError || !!amountError}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Review Withdrawal"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-purple-100 text-sm mb-2">Available Balance</p>
                <p className="text-3xl font-bold mb-1">{userBalance.toFixed(4)} ETH</p>
                <p className="text-purple-100 text-sm">
                  ≈ ${(userBalance * ethPrice).toLocaleString()}
                </p>
              </div>

              {/* Limits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Withdrawal Limits
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Minimum</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">0.001 ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Maximum</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {userBalance.toFixed(4)} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processing Time</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">3-5 minutes</p>
                  </div>
                </div>
              </div>

              {/* Help */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Need Help?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Contact support if you need assistance with withdrawals.
                </p>
                <button className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors text-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Withdrawal
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">To Address:</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                    {destinationAddress}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount:</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {amount} ETH
                  </p>
                  {estimate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      + {estimate.estimatedCostEth.toFixed(6)} ETH gas fee
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 dark:text-red-300">
                  ⚠️ This action cannot be undone. Please verify all details are correct.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmWithdrawal}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardRouteGuard>
  );
}
