"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RewardsDashboardProps {
  userId: string;
}

interface Reward {
  id: string;
  type: string;
  amount: string;
  status: string;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface TierInfo {
  currentTier: string;
  points: number;
  lifetimePoints: number;
  streak: number;
  longestStreak: number;
  progress: number;
  nextTier: string | null;
  pointsToNextTier: number | null;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  points: number;
  tier: string;
  rank: number;
}

const TIER_COLORS = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-500",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-blue-300 to-blue-500",
  diamond: "from-cyan-300 to-cyan-500",
};

const TIER_EMOJIS = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "💠",
};

export default function RewardsDashboard({ userId }: RewardsDashboardProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rewards" | "tier" | "leaderboard">("rewards");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/rewards/pending/${userId}`);
      const data = await res.json();
      setRewards(data.rewards || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTierInfo = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/rewards/tier/${userId}`);
      const data = await res.json();
      setTierInfo(data.tier);
    } catch (error) {
      console.error("Error fetching tier info:", error);
    }
  }, [userId]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:4000/api/rewards/leaderboard?limit=10");
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }, []);

  useEffect(() => {
    void fetchRewards();
    void fetchTierInfo();
    void fetchLeaderboard();
  }, [fetchRewards, fetchTierInfo, fetchLeaderboard]);

  const handleClaimReward = async (rewardId: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, rewardId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Claimed ${data.tokensAwarded} ADV!` });
        fetchRewards();
        fetchTierInfo();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to claim reward" });
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/rewards/streak/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Daily check-in! +${data.tokensAwarded} ADV` });
        fetchTierInfo();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Already checked in today" });
      }
    } catch (error) {
      console.error("Error updating streak:", error);
      setMessage({ type: "error", text: "Network error" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Card */}
      {tierInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${TIER_COLORS[tierInfo.currentTier as keyof typeof TIER_COLORS]} rounded-2xl p-8 text-white shadow-2xl`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">{TIER_EMOJIS[tierInfo.currentTier as keyof typeof TIER_EMOJIS]}</span>
                <div>
                  <h2 className="text-3xl font-bold capitalize">{tierInfo.currentTier} Tier</h2>
                  <p className="text-sm opacity-90">{tierInfo.points.toLocaleString()} points</p>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckIn}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Daily Check-In 🎁
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {tierInfo.nextTier || "Max Level"}</span>
                <span>{tierInfo.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tierInfo.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-white rounded-full h-3"
                />
              </div>
              {tierInfo.pointsToNextTier && (
                <p className="text-xs opacity-75 mt-1">{tierInfo.pointsToNextTier.toLocaleString()} points needed</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{tierInfo.streak}</p>
                <p className="text-xs opacity-75">Day Streak 🔥</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{tierInfo.longestStreak}</p>
                <p className="text-xs opacity-75">Best Streak 🏆</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{tierInfo.lifetimePoints.toLocaleString()}</p>
                <p className="text-xs opacity-75">Lifetime Points ⭐</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
        {["rewards", "tier", "leaderboard"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold capitalize transition-colors ${
              activeTab === tab
                ? "bg-gradient-to-r from-gold to-amber-400 text-navy"
                : "text-gray-600 hover:text-navy"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "rewards" && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-navy mb-4">Pending Rewards</h3>
            <div className="space-y-3">
              {rewards.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending rewards</p>
              ) : (
                rewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-gold"
                  >
                    <div>
                      <p className="font-semibold text-navy capitalize">{reward.type.replace("_", " ")}</p>
                      <p className="text-sm text-gray-600">{reward.description || "No description"}</p>
                      {reward.expiresAt && (
                        <p className="text-xs text-red-500 mt-1">
                          Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gold">+{parseFloat(reward.amount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">ADV</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaimReward(reward.id)}
                        className="bg-gold hover:bg-amber-500 text-navy px-6 py-2 rounded-xl font-semibold transition-colors shadow-lg"
                      >
                        Claim
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "tier" && tierInfo && (
          <motion.div
            key="tier"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-navy mb-4">Tier System</h3>
            <div className="space-y-4">
              {[
                { name: "Bronze", points: 0, multiplier: "1.0x" },
                { name: "Silver", points: 1000, multiplier: "1.2x" },
                { name: "Gold", points: 5000, multiplier: "1.5x" },
                { name: "Platinum", points: 15000, multiplier: "2.0x" },
                { name: "Diamond", points: 50000, multiplier: "3.0x" },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`p-4 rounded-xl border-2 ${
                    tierInfo.currentTier === tier.name.toLowerCase()
                      ? "border-gold bg-amber-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{TIER_EMOJIS[tier.name.toLowerCase() as keyof typeof TIER_EMOJIS]}</span>
                      <div>
                        <p className="font-bold text-navy">{tier.name}</p>
                        <p className="text-sm text-gray-600">{tier.points.toLocaleString()} points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold">{tier.multiplier}</p>
                      <p className="text-xs text-gray-500">Multiplier</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-navy mb-4">Top Users 🏆</h3>
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    entry.userId === userId ? "bg-amber-50 border border-gold" : "bg-gray-50"
                  }`}
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    {entry.rank <= 3 ? (
                      <span className="text-2xl">
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-gray-500">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy">{entry.userName || `User ${entry.userId.slice(0, 8)}`}</p>
                    <p className="text-sm text-gray-600 capitalize">{entry.tier} Tier</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy">{entry.points.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
