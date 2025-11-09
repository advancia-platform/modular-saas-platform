"use client";

import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import Logo from "@/components/Logo";
import DebitCard from "@/components/DebitCard";
import MedBeds from "@/components/MedBeds";
import CryptoRecovery from "@/components/CryptoRecovery";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreditCard, Activity, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<"cards" | "medbeds" | "crypto">("cards");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const tabs = [
    { id: "cards" as const, label: "Debit Cards", icon: CreditCard, color: "from-blue-600 to-purple-600" },
    { id: "medbeds" as const, label: "Med Beds", icon: Activity, color: "from-purple-600 to-pink-600" },
    { id: "crypto" as const, label: "Crypto Recovery", icon: Shield, color: "from-green-600 to-emerald-600" },
  ];

  // Initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle tab change with loading
  const handleTabChange = (tabId: "cards" | "medbeds" | "crypto") => {
    if (tabId !== activeTab) {
      setIsLoading(true);
      setTimeout(() => {
        setActiveTab(tabId);
        setIsLoading(false);
      }, 800);
    }
  };

  // Show loading on initial load
  if (initialLoad) {
    return <LoadingSpinner size="lg" variant="both" message="Loading Features..." />;
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header with Logo */}
        <div className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" showText={true} variant="gradient" />
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold"
                >
                  <TrendingUp size={18} />
                  <span>$5,250.00</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange(tab.id)}
                disabled={isLoading}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
              <div className="relative">
                {/* Spinning Circle */}
                <motion.div
                  className="w-16 h-16 border-4 border-transparent border-t-blue-600 border-r-purple-600 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                {/* Spinning Triangle */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div 
                    className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-indigo-600"
                    style={{
                      filter: "drop-shadow(0 0 10px rgba(79, 70, 229, 0.5))"
                    }}
                  />
                </motion.div>
                {/* Center Pulse */}
                <motion.div
                  className="absolute inset-0 m-auto w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </div>
          )}

          {/* Content Area */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "cards" && <DebitCard />}
            {activeTab === "medbeds" && <MedBeds />}
            {activeTab === "crypto" && <CryptoRecovery />}
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
