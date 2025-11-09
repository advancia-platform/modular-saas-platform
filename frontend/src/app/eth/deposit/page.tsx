"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";
import QRCode from "qrcode";
import { Toaster, toast } from "react-hot-toast";

interface DepositTransaction {
  id: string;
  txHash: string | null;
  amountEth: number;
  status: string;
  timestamp: string;
  confirmations: number;
  memo?: string | null;
}

export default function EthDepositPage() {
  const router = useRouter();
  const [userAddress, setUserAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [ethPrice, setEthPrice] = useState(0);
  const [recentDeposits, setRecentDeposits] = useState<DepositTransaction[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);

  useEffect(() => {
    fetchUserWalletAddress();
    fetchEthPrice();
  }, []);

  useEffect(() => {
    if (userAddress) {
      fetchRecentDeposits(userAddress);
    }
  }, [userAddress]);

  useEffect(() => {
    if (!showQR || !userAddress) {
      setQrCodeDataUrl("");
      setQrError(null);
      return;
    }

    let isActive = true;
    const generateQr = async () => {
      setQrLoading(true);
      try {
        const dataUrl = await QRCode.toDataURL(userAddress, {
          width: 256,
          margin: 1,
          errorCorrectionLevel: "M",
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        if (isActive) {
          setQrCodeDataUrl(dataUrl);
          setQrError(null);
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        if (isActive) {
          setQrError("Failed to generate QR code");
          toast.error("Failed to generate QR code. Please try again.");
        }
      } finally {
        if (isActive) {
          setQrLoading(false);
        }
      }
    };

    generateQr();

    return () => {
      isActive = false;
    };
  }, [showQR, userAddress]);

  const fetchUserWalletAddress = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

       if (!token || !userId) {
        setUserAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
        setLoading(false);
        toast("Using demo wallet address", { icon: "ℹ️" });
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // For demo, use a sample address if none exists
        setUserAddress(data.ethWalletAddress || "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
      } else {
        toast.error("Unable to load wallet address");
        setUserAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
      }
    } catch (error) {
      console.error("Error fetching wallet address:", error);
      toast.error("Error fetching wallet address");
      setUserAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
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
      toast.error("Unable to fetch ETH price");
    }
  };

  const fetchRecentDeposits = async (address: string) => {
    try {
      setDepositLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(
        `${API_URL}/api/eth/deposits?address=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load deposits");
      }

      const data = await response.json();
      setRecentDeposits(data.deposits || []);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast.error("Unable to load recent deposits");
      setRecentDeposits([]);
    } finally {
      setDepositLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userAddress);
      setCopied(true);
      toast.success("Deposit address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Unable to copy address");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "FAILED":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "✓";
      case "PENDING":
        return "⏳";
      case "FAILED":
        return "✗";
      default:
        return "?";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
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

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-8">
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
              Deposit Ethereum (ETH)
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send ETH to your unique deposit address below
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Deposit Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deposit Address Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Your ETH Deposit Address
                  </h2>
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Show QR Code"
                  >
                    <QrCode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Address Display */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-sm font-mono text-gray-900 dark:text-white break-all flex-1">
                      {userAddress}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                {showQR && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 flex flex-col items-center mb-4">
                    <div className="w-48 h-48 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      {qrLoading ? (
                        <Loader2 className="w-8 h-8 text-gray-500 dark:text-gray-300 animate-spin" />
                      ) : qrCodeDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrCodeDataUrl}
                          alt="Deposit QR code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-24 h-24 text-gray-400" />
                      )}
                    </div>
                    {qrError ? (
                      <p className="text-sm text-red-500 dark:text-red-400 text-center">{qrError}</p>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Scan this QR code with your wallet app
                      </p>
                    )}
                  </div>
                )}

                {/* Important Instructions */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                        Important Instructions
                      </h3>
                      <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                        <li>• Only send Ethereum (ETH) to this address</li>
                        <li>• Minimum deposit: 0.001 ETH</li>
                        <li>• Deposits require 12 confirmations (~3 minutes)</li>
                        <li>• Do not send tokens (ERC-20) to this address</li>
                        <li>• Your balance will update automatically after confirmation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Deposits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Deposits
                </h2>

                {depositLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading activity...
                  </div>
                ) : recentDeposits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📭</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">No deposits yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Send ETH to the address above to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentDeposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                deposit.status
                              )}`}
                            >
                              {getStatusIcon(deposit.status)} {deposit.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {deposit.confirmations}/12 confirmations
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimestamp(deposit.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {deposit.amountEth.toFixed(4)} ETH
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ≈ ${(deposit.amountEth * ethPrice).toFixed(2)}
                            </p>
                          </div>

                          {deposit.txHash ? (
                            <a
                              href={`https://etherscan.io/tx/${deposit.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                              View on Etherscan
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Awaiting transaction hash
                            </span>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                            {deposit.txHash ? `TX: ${deposit.txHash}` : "Awaiting broadcast"}
                          </p>
                          {deposit.memo && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Note: {deposit.memo}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Network Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Network Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      Ethereum Mainnet
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Minimum Deposit</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      0.001 ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Confirmations</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      12 blocks
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Est. Time</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      ~3 minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current ETH Price</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      ${ethPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                  Need Help?
                </h3>
                <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-4">
                  Having trouble with deposits? Our support team is here to help.
                </p>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                  Contact Support
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                    View Balance
                  </button>
                  <button
                    onClick={() => router.push("/eth/withdraw")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Withdraw ETH
                  </button>
                  <button
                    onClick={() => router.push("/eth/transactions")}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                    Transaction History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
