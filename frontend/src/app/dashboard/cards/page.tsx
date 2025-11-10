"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Lock, Settings, TrendingUp, Send, Ban, Snowflake } from "lucide-react";

interface DebitCard {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardType: string;
  status: string;
  balance: number;
  dailyLimit: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  status: string;
}

export default function DebitCardsPage() {
  const [cards, setCards] = useState<DebitCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<DebitCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Forms
  const [pinForm, setPinForm] = useState({ oldPin: "", newPin: "", confirmPin: "" });
  const [limitForm, setLimitForm] = useState({ dailyLimit: "" });
  const [nameForm, setNameForm] = useState({ cardHolderName: "" });

  const fetchCards = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/debit-cards/my-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
        if (data.cards.length > 0 && !selectedCard) {
          setSelectedCard(data.cards[0]);
        }
      }
    } catch {
      console.error("Failed to fetch cards");
    }
  }, [selectedCard]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    if (selectedCard) {
      fetchTransactions(selectedCard.id);
    }
  }, [selectedCard]);

  const fetchTransactions = async (cardId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/transactions/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions);
    } catch {
      console.error("Failed to fetch transactions");
    }
  };

  const handleFreezeCard = async (freeze: boolean) => {
    if (!selectedCard) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/freeze/${selectedCard.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ freeze }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchCards();
    } catch {
      alert("Failed to update card status");
    }
    setLoading(false);
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    if (pinForm.newPin !== pinForm.confirmPin) {
      alert("PINs do not match");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/set-pin/${selectedCard.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPin: pinForm.oldPin, newPin: pinForm.newPin }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) {
        setPinForm({ oldPin: "", newPin: "", confirmPin: "" });
      }
    } catch {
      alert("Failed to set PIN");
    }
    setLoading(false);
  };

  const handleSetLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/set-limits/${selectedCard.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dailyLimit: parseFloat(limitForm.dailyLimit) }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchCards();
    } catch {
      alert("Failed to set limits");
    }
    setLoading(false);
  };

  const handleCustomizeName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/customize/${selectedCard.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardHolderName: nameForm.cardHolderName }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchCards();
    } catch {
      alert("Failed to customize card");
    }
    setLoading(false);
  };

  const handleRequestPhysical = async () => {
    if (!selectedCard) return;
    const address = prompt("Enter your shipping address:");
    if (!address) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/request-physical/${selectedCard.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shippingAddress: address, expedited: false }),
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch {
      alert("Failed to request physical card");
    }
    setLoading(false);
  };

  const handleCancelCard = async () => {
    if (!selectedCard) return;
    if (!confirm("Are you sure you want to cancel this card? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/debit-cards/${selectedCard.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) {
        setSelectedCard(null);
        fetchCards();
      }
    } catch {
      alert("Failed to cancel card");
    }
    setLoading(false);
  };

  const getCardColor = (status: string) => {
    switch (status) {
      case "active":
        return "from-blue-500 to-purple-600";
      case "frozen":
        return "from-gray-400 to-gray-600";
      case "cancelled":
        return "from-red-400 to-red-600";
      default:
        return "from-green-500 to-teal-600";
    }
  };

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Debit Cards</h1>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CreditCard size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Cards Yet</h2>
            <p className="text-gray-600 mb-6">Order your first debit card to get started</p>
            <a
              href="/debit-card/order"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Order Debit Card
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Debit Cards</h1>
          <a
            href="/debit-card/order"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Order New Card
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Display */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Your Cards</h2>
              <div className="space-y-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      selectedCard?.id === card.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`bg-gradient-to-r ${getCardColor(card.status)} text-white p-6 rounded-xl mb-2`}>
                      <div className="flex justify-between items-start mb-8">
                        <div className="text-xs font-semibold">
                          {card.cardType === "physical" ? "PHYSICAL" : "VIRTUAL"}
                        </div>
                        <CreditCard size={32} />
                      </div>
                      <div className="text-lg font-mono tracking-wider mb-4">
                        {card.cardNumber}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs opacity-75">CARDHOLDER</div>
                          <div className="text-sm font-semibold">{card.cardHolderName}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-75">EXPIRES</div>
                          <div className="text-sm font-semibold">
                            {card.expiryMonth.toString().padStart(2, "0")}/{card.expiryYear.toString().slice(-2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-semibold">${card.balance.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${
                        card.status === "active" ? "text-green-600" :
                        card.status === "frozen" ? "text-blue-600" :
                        "text-red-600"
                      }`}>
                        {card.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Management */}
          <div className="lg:col-span-2">
            {selectedCard && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b">
                  {["overview", "transactions", "settings", "security"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Daily Limit</div>
                        <div className="text-2xl font-bold text-blue-600">
                          ${selectedCard.dailyLimit.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Available Balance</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${selectedCard.balance.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleFreezeCard(selectedCard.status !== "frozen")}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium ${
                          selectedCard.status === "frozen"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-yellow-600 hover:bg-yellow-700 text-white"
                        }`}
                      >
                        <Snowflake size={20} />
                        {selectedCard.status === "frozen" ? "Unfreeze Card" : "Freeze Card"}
                      </button>

                      {selectedCard.cardType === "virtual" && (
                        <button
                          onClick={handleRequestPhysical}
                          disabled={loading}
                          className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
                        >
                          <Send size={20} />
                          Request Physical Card
                        </button>
                      )}

                      <button
                        onClick={handleCancelCard}
                        disabled={loading}
                        className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                      >
                        <Ban size={20} />
                        Cancel Card
                      </button>
                    </div>
                  </div>
                )}

                {/* Transactions Tab */}
                {activeTab === "transactions" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    {transactions.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">No transactions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{tx.description}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className={`font-bold ${tx.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                              {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <form onSubmit={handleCustomizeName}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings size={20} />
                        Card Name
                      </h3>
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={nameForm.cardHolderName}
                        onChange={(e) => setNameForm({ cardHolderName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg mb-4"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                      >
                        Update Name
                      </button>
                    </form>

                    <form onSubmit={handleSetLimits}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Spending Limits
                      </h3>
                      <input
                        type="number"
                        placeholder="Daily Limit ($)"
                        value={limitForm.dailyLimit}
                        onChange={(e) => setLimitForm({ dailyLimit: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg mb-4"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                      >
                        Update Limits
                      </button>
                    </form>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <form onSubmit={handleSetPin}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lock size={20} />
                      Change PIN
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="password"
                        placeholder="Current PIN (4 digits)"
                        maxLength={4}
                        value={pinForm.oldPin}
                        onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="password"
                        placeholder="New PIN (4 digits)"
                        maxLength={4}
                        value={pinForm.newPin}
                        onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New PIN"
                        maxLength={4}
                        value={pinForm.confirmPin}
                        onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                      >
                        Set New PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
