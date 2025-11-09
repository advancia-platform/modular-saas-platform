"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Unlock,
  Plus,
  Settings,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Wallet,
} from "lucide-react";

interface Card {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  balance: number;
  status: "active" | "frozen" | "pending";
  type: "virtual" | "physical";
  dailyLimit: number;
  spentToday: number;
  color: string;
}

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
};

export default function DebitCard() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  
  // Get username from session or use default
  const userName = sessionUser?.name || sessionUser?.email?.split('@')[0] || "ADVANCIA USER";
  const displayName = userName.toUpperCase();

  const [cards, setCards] = useState<Card[]>([
    {
      id: "1",
      cardNumber: "4532 **** **** 8790",
      cardholderName: displayName,
      expiryDate: "12/28",
      cvv: "***",
      balance: 5250.00,
      status: "active",
      type: "virtual",
      dailyLimit: 5000,
      spentToday: 1250,
      color: "from-blue-600 via-purple-600 to-indigo-700",
    },
  ]);

  const [selectedCard, setSelectedCard] = useState(cards[0]);
  const [showCVV, setShowCVV] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);

  // Update card holder name when session changes
  useEffect(() => {
    setCards(prevCards => prevCards.map(card => ({
      ...card,
      cardholderName: displayName
    })));
    setSelectedCard(prev => ({ ...prev, cardholderName: displayName }));
  }, [displayName]);

  const recentTransactions = [
    { id: "1", merchant: "Amazon", amount: -89.99, date: "Today, 2:30 PM", category: "shopping", icon: ShoppingCart },
    { id: "2", merchant: "Starbucks", amount: -5.50, date: "Today, 9:15 AM", category: "food", icon: DollarSign },
    { id: "3", merchant: "Salary Deposit", amount: 3500.00, date: "Yesterday", category: "income", icon: TrendingUp },
    { id: "4", merchant: "Netflix", amount: -15.99, date: "Dec 1", category: "entertainment", icon: ShoppingCart },
  ];

  const toggleCardStatus = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId 
        ? { ...card, status: card.status === "active" ? "frozen" : "active" }
        : card
    ));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Debit Cards
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage your virtual and physical cards</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => alert("Add card feature coming soon!")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus size={20} />
          Add Card
        </motion.button>
      </div>

      {/* Card Display */}
      <motion.div
        layout
        className="relative"
      >
        <motion.div
          className={`bg-gradient-to-br ${selectedCard.color} rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden`}
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ duration: 0.3 }}
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          {/* Card Content */}
          <div className="relative z-10">
            {/* Card Type & Status */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <CreditCard size={24} />
                <span className="text-sm font-semibold uppercase">{selectedCard.type} Card</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedCard.status === "active" ? (
                  <>
                    <CheckCircle size={16} />
                    <span className="text-xs font-semibold">ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span className="text-xs font-semibold">FROZEN</span>
                  </>
                )}
              </div>
            </div>

            {/* Chip */}
            <div className="mb-6">
              <div className="w-14 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md" />
            </div>

            {/* Card Number */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono tracking-wider">
                  {showCardNumber ? "4532 1234 5678 8790" : selectedCard.cardNumber}
                </span>
                <button
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showCardNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Cardholder & Expiry */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs opacity-70 mb-1">CARDHOLDER</p>
                <p className="text-sm font-semibold tracking-wide">{selectedCard.cardholderName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 mb-1">EXPIRES</p>
                <p className="text-sm font-semibold">{selectedCard.expiryDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 mb-1">CVV</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{showCVV ? "123" : selectedCard.cvv}</p>
                  <button
                    onClick={() => setShowCVV(!showCVV)}
                    className="hover:bg-white/20 rounded p-1 transition-colors"
                  >
                    {showCVV ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card Actions */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleCardStatus(selectedCard.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 ${
              selectedCard.status === "active"
                ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
            } transition-colors`}
          >
            {selectedCard.status === "active" ? <Lock size={24} /> : <Unlock size={24} />}
            <span className="text-sm font-semibold mt-2">
              {selectedCard.status === "active" ? "Freeze Card" : "Unfreeze"}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => copyToClipboard(selectedCard.cardNumber, "Card number")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Copy size={24} />
            <span className="text-sm font-semibold mt-2">Copy Number</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          >
            <Settings size={24} />
            <span className="text-sm font-semibold mt-2">Settings</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Card Balance & Limits */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Available Balance</h3>
            <Wallet className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">${selectedCard.balance.toFixed(2)}</p>
          <p className="text-sm text-slate-600 mt-2">Updated just now</p>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Daily Limit</h3>
            <AlertCircle className="text-blue-600" size={20} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Spent Today</span>
              <span className="font-semibold">${selectedCard.spentToday.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(selectedCard.spentToday / selectedCard.dailyLimit) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>$0</span>
              <span>${selectedCard.dailyLimit.toFixed(2)} limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.amount > 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"}`}>
                  <tx.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{tx.merchant}</p>
                  <p className="text-xs text-slate-500">{tx.date}</p>
                </div>
              </div>
              <p className={`text-lg font-bold ${tx.amount > 0 ? "text-green-600" : "text-slate-800"}`}>
                {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
