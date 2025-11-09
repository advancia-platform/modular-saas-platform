"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Shield,
  Key,
  Lock,
  Copy,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  QrCode,
  Share2,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";

interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  currency: string;
  recoveryStatus: "secured" | "at-risk" | "recovered";
}

type SessionUser = {
  id?: string;
  email?: string;
};

export default function CryptoRecovery() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = sessionUser?.id || "demo-user";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const wallets: Wallet[] = [
    {
      id: "1",
      name: "Bitcoin Wallet",
      address: "bc1q37a9kpzyea5cahpyx8xpx6v7vr5na64f4cxxnt",
      balance: 0.15,
      currency: "BTC",
      recoveryStatus: "secured",
    },
    {
      id: "2",
      name: "Ethereum Wallet",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab",
      balance: 2.5,
      currency: "ETH",
      recoveryStatus: "secured",
    },
    {
      id: "3",
      name: "Stellar Wallet",
      address: "GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJNXE",
      balance: 15420.50,
      currency: "XLM",
      recoveryStatus: "secured",
    },
    {
      id: "4",
      name: "Ripple Wallet",
      address: "rN7n7otQDd6FczFgLdlqtyMVrn3HMfgh1U",
      balance: 2850.75,
      currency: "XRP",
      recoveryStatus: "secured",
    },
    {
      id: "5",
      name: "Trump Coin Wallet",
      address: "0xTRUMP45Cc6634C0532925a3b844Bc9e7595f89MAGA",
      balance: 100000,
      currency: "TRUMP",
      recoveryStatus: "secured",
    },
  ];

  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(wallets[0]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<"seed" | "multisig" | "social">("seed");
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Generate QR code for selected wallet
  const generateQRCode = async (address: string) => {
    try {
      const url = await QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const openReceiveModal = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    generateQRCode(wallet.address);
    setShowReceiveModal(true);
    setSaveFeedback(null);
  };

  const seedWords = [
    "abandon", "ability", "able", "about", "above", "absent",
    "absorb", "abstract", "absurd", "abuse", "access", "accident",
  ];

  const backupMethods = [
    {
      id: "seed",
      name: "Seed Phrase Recovery",
      icon: Key,
      color: "from-yellow-500 to-orange-600",
      description: "12-24 word backup phrase",
      security: "High",
    },
    {
      id: "multisig",
      name: "Multi-Signature",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      description: "Require multiple approvals",
      security: "Very High",
    },
    {
      id: "social",
      name: "Social Recovery",
      icon: Shield,
      color: "from-green-500 to-emerald-600",
      description: "Trusted contacts backup",
      security: "High",
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleSaveQrSnapshot = async () => {
    if (!selectedWallet || !qrCodeUrl) return;

    try {
      setIsSavingSnapshot(true);
      setSaveFeedback(null);

      const response = await fetch(`${API_URL}/api/recovery/qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletId: selectedWallet.id,
          address: selectedWallet.address,
          qrDataUrl: qrCodeUrl,
          userId,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const reason = (errorBody as { error?: string } | null)?.error;
        setSaveFeedback(reason || "Failed to store recovery snapshot.");
        return;
      }

      setSaveFeedback("Recovery snapshot sent to secure vault.");
    } catch (error) {
      console.error("Failed to upload recovery snapshot", error);
      setSaveFeedback("Network error while saving snapshot.");
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield size={32} />
            Crypto Recovery Suite
          </h2>
          <p className="text-white/90">Military-grade wallet recovery and backup solutions</p>
          <p className="mt-2 text-sm text-white/75">
            Securing assets for <span className="font-semibold">{sessionUser?.email || "demo@advancia.com"}</span> (
            <span className="font-mono">{userId}</span>)
          </p>
        </div>
      </div>

      {/* Wallet Overview */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Your Wallets</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900">{wallet.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {wallet.address}
                    </code>
                    <button title="Copy address" onClick={() => copyToClipboard(wallet.address)} className="p-1 hover:bg-slate-100 rounded transition-colors">
                      <Copy size={14} className="text-slate-600" />
                    </button>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${
                  wallet.recoveryStatus === "secured"
                    ? "bg-green-100 text-green-600"
                    : wallet.recoveryStatus === "at-risk"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-blue-100 text-blue-600"
                }`}>
                  {wallet.recoveryStatus === "secured" ? (
                    <CheckCircle size={20} />
                  ) : wallet.recoveryStatus === "at-risk" ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <RefreshCw size={20} />
                  )}
                </div>
              </div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {wallet.balance.toFixed(4)}
                  </p>
                  <p className="text-sm text-slate-600">{wallet.currency}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  wallet.recoveryStatus === "secured"
                    ? "bg-green-100 text-green-700"
                    : wallet.recoveryStatus === "at-risk"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {wallet.recoveryStatus === "secured" ? "Secured" : wallet.recoveryStatus === "at-risk" ? "At Risk" : "Recovered"}
                </span>
              </div>
              
              {/* Receive Button */}
              <button
                onClick={() => openReceiveModal(wallet)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
              >
                <QrCode size={18} />
                Receive {wallet.currency}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && selectedWallet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowReceiveModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl p-8 max-w-md w-full text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Receive</h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-200">
                Only send {selectedWallet.currency} ({selectedWallet.name.split(' ')[0]}) assets to this address. Other assets will be lost forever.
              </p>
            </div>

            {/* Currency Info */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">{selectedWallet.currency.charAt(0)}</span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedWallet.currency}</p>
                <p className="text-sm text-slate-400">{selectedWallet.name.split(' ')[0]}</p>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="bg-white rounded-xl p-6 mb-6 flex items-center justify-center">
                <Image src={qrCodeUrl} alt="QR Code" width={256} height={256} className="h-64 w-64" unoptimized />
              </div>
            )}

            {/* Address */}
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-400 mb-2 text-center">Address</p>
              <p className="text-center font-mono text-sm break-all">{selectedWallet.address}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => copyToClipboard(selectedWallet.address)}
                className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Copy size={24} className="mb-2" />
                <span className="text-xs">Copy</span>
              </button>
              <button
                onClick={() => alert("Set amount feature coming soon!")}
                className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <DollarSign size={24} className="mb-2" />
                <span className="text-xs">Set Amount</span>
              </button>
              <button
                onClick={() => alert("Share feature coming soon!")}
                className="flex flex-col items-center justify-center p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Share2 size={24} className="mb-2" />
                <span className="text-xs">Share</span>
              </button>
            </div>

            <button
              onClick={handleSaveQrSnapshot}
              disabled={isSavingSnapshot}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-wait disabled:opacity-70"
            >
              {isSavingSnapshot ? "Saving recovery snapshot…" : "Save Recovery Snapshot"}
            </button>

            {saveFeedback && (
              <p className="mt-3 text-center text-sm text-emerald-200">{saveFeedback}</p>
            )}

            {/* Deposit Info */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Download size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Deposit from exchange</p>
                  <p className="text-sm text-slate-400">By direct transfer from your account</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Recovery Methods */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">Recovery Methods</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {backupMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setRecoveryMethod(method.id as typeof recoveryMethod)}
              className={`cursor-pointer rounded-2xl overflow-hidden ${
                recoveryMethod === method.id ? "ring-4 ring-blue-500 ring-offset-2" : ""
              }`}
            >
              <div className={`bg-gradient-to-br ${method.color} p-6 text-white`}>
                <method.icon size={40} className="mb-4" />
                <h4 className="text-lg font-bold mb-2">{method.name}</h4>
                <p className="text-sm opacity-90 mb-3">{method.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span>Security Level:</span>
                  <span className="font-semibold">{method.security}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Seed Phrase Management */}
      {recoveryMethod === "seed" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">Seed Phrase Backup</h3>
            <button
              onClick={() => setShowSeedPhrase(!showSeedPhrase)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {showSeedPhrase ? <EyeOff size={18} /> : <Eye size={18} />}
              {showSeedPhrase ? "Hide" : "Show"} Phrase
            </button>
          </div>

          {showSeedPhrase ? (
            <>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {seedWords.map((word, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 border-2 border-slate-200 rounded-lg p-3 text-center"
                  >
                    <span className="text-xs text-slate-500">{index + 1}.</span>
                    <p className="font-mono font-semibold text-slate-900">{word}</p>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-yellow-900">Critical Security Warning</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Never share your seed phrase with anyone. Write it down and store it in a secure location.
                    Anyone with access to this phrase can access your funds.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(seedWords.join(" "))}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Copy size={18} />
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => alert("Downloading backup...")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <Download size={18} />
                  Download Backup
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Lock size={48} className="text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Click &quot;Show Phrase&quot; to reveal your seed words</p>
              <p className="text-sm text-slate-500 mt-2">Make sure you&apos;re in a private location</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Multi-Sig Setup */}
      {recoveryMethod === "multisig" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4">Multi-Signature Setup</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">Current Configuration</p>
              <p className="text-sm text-blue-800">2 of 3 signatures required for transactions</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Primary Signer</p>
                    <p className="text-xs text-slate-600">0x742d...89Ab</p>
                  </div>
                </div>
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Secondary Signer</p>
                    <p className="text-xs text-slate-600">0x8f3a...12Cd</p>
                  </div>
                </div>
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Recovery Signer</p>
                    <p className="text-xs text-slate-600">0x1b7e...56Ef</p>
                  </div>
                </div>
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Social Recovery */}
      {recoveryMethod === "social" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4">Social Recovery Guardians</h3>
          <p className="text-sm text-slate-600 mb-4">
            Select trusted contacts who can help recover your wallet if you lose access.
            3 out of 5 guardians must approve recovery.
          </p>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow">
            <Users size={18} />
            Add Guardian
          </button>
        </motion.div>
      )}

      {/* Recovery Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
          <Upload size={20} />
          Import Wallet
        </button>
        <button className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
          <RefreshCw size={20} />
          Restore from Backup
        </button>
      </div>
    </div>
  );
}
