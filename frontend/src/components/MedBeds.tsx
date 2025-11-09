"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Heart,
  Brain,
  Zap,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Shield,
  Sparkles,
  X,
  DollarSign,
  Wallet,
} from "lucide-react";

interface Chamber {
  id: string;
  name: string;
  type: "recovery" | "enhancement" | "diagnostic";
  status: "available" | "in-use";
  icon: typeof Heart;
  color: string;
  features: string[];
}

interface Session {
  id: string;
  type: "recovery" | "enhancement" | "diagnostic";
  date: string;
  duration: number;
  status: "completed" | "scheduled" | "in-progress";
  effectiveness: number;
}

export default function MedBeds() {
  const [activeChamber, setActiveChamber] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [paymentMethod, setPaymentMethod] = useState<"balance" | "stripe">(
    "balance"
  );
  const [usdBalance, setUsdBalance] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const chambers = [
    {
      id: "chamber-1",
      name: "Recovery Chamber Alpha",
      type: "recovery" as const,
      status: "available" as const,
      icon: Heart,
      color: "from-green-500 to-emerald-600",
      features: ["Cellular Regeneration", "Pain Relief", "Energy Restoration"],
    },
    {
      id: "chamber-2",
      name: "Enhancement Chamber Beta",
      type: "enhancement" as const,
      status: "available" as const,
      icon: Zap,
      color: "from-purple-500 to-pink-600",
      features: ["Cognitive Boost", "Physical Enhancement", "Immunity Upgrade"],
    },
    {
      id: "chamber-3",
      name: "Diagnostic Chamber Gamma",
      type: "diagnostic" as const,
      status: "in-use" as const,
      icon: Brain,
      color: "from-blue-500 to-cyan-600",
      features: ["Full Body Scan", "DNA Analysis", "Health Metrics"],
    },
  ];

  // Fetch user balance and bookings on mount
  React.useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        // Fetch user balance
        const userRes = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUsdBalance(Number(userData.usdBalance || 0));
        }

        // Fetch bookings
        const bookingsRes = await fetch(`${API}/api/medbeds/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();
          setSessions(
            bookings.map(
              (b: {
                id: string;
                chamberType: string;
                sessionDate: string;
                duration: number;
                status: string;
                effectiveness?: number;
              }) => ({
                id: b.id,
                type: b.chamberType as
                  | "recovery"
                  | "enhancement"
                  | "diagnostic",
                date: b.sessionDate,
                duration: b.duration,
                status: b.status as "completed" | "scheduled" | "in-progress",
                effectiveness: b.effectiveness || 0,
              })
            )
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [API]);

  const handleBookSession = (chamber: Chamber) => {
    setSelectedChamber(chamber);
    setActiveChamber(null);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedChamber || !bookingDate) return;

    const cost = (bookingDuration / 60) * 150;

    if (paymentMethod === "balance" && usdBalance < cost) {
      alert(
        `Insufficient balance. You need $${cost.toFixed(
          2
        )} but only have $${usdBalance.toFixed(2)}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to book a session");
        return;
      }

      const response = await fetch(`${API}/api/medbeds/book-with-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chamberType: selectedChamber.type,
          chamberName: selectedChamber.name,
          sessionDate: bookingDate,
          duration: bookingDuration,
          paymentMethod,
          notes: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Booking failed");
      }

      if (paymentMethod === "stripe" && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Balance payment successful
        const newSession: Session = {
          id: data.booking.id,
          type: selectedChamber.type,
          date: bookingDate,
          duration: bookingDuration,
          status: "scheduled",
          effectiveness: 0,
        };

        setSessions([newSession, ...sessions]);
        setUsdBalance((prev) => prev - cost);
        setShowBookingModal(false);
        setSelectedChamber(null);
        setBookingDate("");
        setBookingDuration(60);
        setPaymentMethod("balance");

        alert("Booking successful! Payment processed from your balance.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(error instanceof Error ? error.message : "Failed to book session");
    } finally {
      setIsProcessing(false);
    }
  };

  const biometrics = [
    {
      label: "Heart Rate",
      value: "72 bpm",
      status: "normal",
      icon: Heart,
      color: "text-green-600",
    },
    {
      label: "Energy Level",
      value: "87%",
      status: "good",
      icon: Zap,
      color: "text-yellow-600",
    },
    {
      label: "Recovery Score",
      value: "94/100",
      status: "excellent",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "Neural Activity",
      value: "Optimal",
      status: "normal",
      icon: Brain,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles size={32} />
            Med Beds - Advanced Recovery System
          </h2>
          <p className="text-white/90">
            Quantum healing technology for optimal health and performance
          </p>
        </div>
      </div>

      {/* Current Biometrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {biometrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={metric.color} size={24} />
              {metric.status === "normal" && (
                <Shield size={16} className="text-green-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            <p className="text-sm text-slate-600">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Available Chambers */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Available Chambers
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {chambers.map((chamber, index) => (
            <motion.div
              key={chamber.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() =>
                chamber.status === "available" && setActiveChamber(chamber.id)
              }
              className={`relative overflow-hidden rounded-2xl cursor-pointer ${
                chamber.status === "in-use"
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            >
              <div
                className={`bg-gradient-to-br ${chamber.color} p-6 text-white`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {chamber.status === "available" ? (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                      Available
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                      In Use
                    </span>
                  )}
                </div>

                {/* Chamber Icon */}
                <div className="mb-4">
                  <chamber.icon size={48} className="opacity-90" />
                </div>

                {/* Chamber Info */}
                <h4 className="text-xl font-bold mb-2">{chamber.name}</h4>
                <p className="text-sm opacity-90 mb-4 capitalize">
                  {chamber.type} Session
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {chamber.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle size={16} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Book Button */}
                {chamber.status === "available" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full mt-4 py-3 font-semibold rounded-xl transition-colors ${
                      activeChamber === chamber.id
                        ? "bg-white text-slate-900 hover:bg-white/90"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeChamber === chamber.id) {
                        handleBookSession(chamber);
                      } else {
                        setActiveChamber(chamber.id);
                      }
                    }}
                  >
                    {activeChamber === chamber.id
                      ? "Confirm Booking"
                      : "Select Chamber"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Session History
        </h3>
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-600"
                      : session.status === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {session.status === "completed" ? (
                    <CheckCircle size={24} />
                  ) : session.status === "in-progress" ? (
                    <Activity size={24} />
                  ) : (
                    <Calendar size={24} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 capitalize">
                    {session.type} Session
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {session.duration} min
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {session.status === "completed" ? (
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {session.effectiveness}%
                      </p>
                      <p className="text-xs text-slate-600">Effectiveness</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          alert(
                            `Cashing out $${(
                              (session.duration / 60) *
                              150
                            ).toFixed(2)} reward`
                          )
                        }
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-shadow flex items-center gap-1"
                      >
                        <DollarSign size={14} />
                        Cash Out
                      </button>
                      <button
                        onClick={() =>
                          alert(
                            `Withdrawing $${(
                              (session.duration / 60) *
                              150
                            ).toFixed(2)} to wallet`
                          )
                        }
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-shadow flex items-center gap-1"
                      >
                        <Wallet size={14} />
                        Withdraw
                      </button>
                    </div>
                  </div>
                ) : session.status === "in-progress" ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    In Progress
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                    Scheduled
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
        <div>
          <p className="font-semibold text-blue-900">
            Important Safety Information
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Med Bed sessions are monitored by AI-powered health systems.
            Emergency protocols are active 24/7. Consult with your health
            advisor before booking enhancement sessions.
          </p>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedChamber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  Book Session
                </h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close booking modal"
                  title="Close"
                >
                  <X size={24} className="text-slate-600" />
                </button>
              </div>

              {/* Chamber Info */}
              <div
                className={`bg-gradient-to-br ${selectedChamber.color} rounded-xl p-6 text-white mb-6`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <selectedChamber.icon size={40} />
                  <div>
                    <h4 className="text-xl font-bold">
                      {selectedChamber.name}
                    </h4>
                    <p className="text-sm opacity-90 capitalize">
                      {selectedChamber.type} Session
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedChamber.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle size={14} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Session Date
                  </label>
                  <input
                    type="date"
                    title="Session Date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Duration
                  </label>
                  <select
                    title="Session Duration"
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value={30}>30 minutes - $75</option>
                    <option value={60}>60 minutes - $150</option>
                    <option value={90}>90 minutes - $225</option>
                    <option value={120}>120 minutes - $300</option>
                  </select>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("balance")}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === "balance"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Wallet
                        size={24}
                        className={
                          paymentMethod === "balance"
                            ? "text-blue-600"
                            : "text-slate-600"
                        }
                      />
                      <p className="text-sm font-semibold mt-2">USD Balance</p>
                      <p className="text-xs text-slate-500">
                        ${usdBalance.toFixed(2)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("stripe")}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === "stripe"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <DollarSign
                        size={24}
                        className={
                          paymentMethod === "stripe"
                            ? "text-blue-600"
                            : "text-slate-600"
                        }
                      />
                      <p className="text-sm font-semibold mt-2">Credit Card</p>
                      <p className="text-xs text-slate-500">via Stripe</p>
                    </button>
                  </div>
                  {paymentMethod === "balance" &&
                    usdBalance < (bookingDuration / 60) * 150 && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ Insufficient balance. Need $
                        {((bookingDuration / 60) * 150 - usdBalance).toFixed(2)}{" "}
                        more.
                      </p>
                    )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBooking}
                  disabled={isProcessing || !bookingDate}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${selectedChamber.color} text-white font-semibold rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing
                    ? "Processing..."
                    : paymentMethod === "stripe"
                    ? "Pay with Card"
                    : "Confirm Booking"}
                </button>
              </div>

              {/* Cost Info */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Session Cost:</span>
                  <span className="font-bold text-slate-900">
                    ${((bookingDuration / 60) * 150).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {paymentMethod === "balance"
                    ? "Will be deducted from your USD balance"
                    : "Secure payment via Stripe"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
