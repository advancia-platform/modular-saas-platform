"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Gift,
  Crown,
  Zap,
  Target,
  Users,
  Medal,
} from "lucide-react";

interface UserTier {
  id: string;
  userId: string;
  currentTier: string;
  points: number;
  lifetimePoints: number;
  lifetimeRewards: string;
  streak: number;
  longestStreak: number;
  totalReferrals: number;
  achievements: string | null;
  badges: string | null;
  referralCode: string | null;
}

interface TierInfo {
  tier: UserTier;
  nextTier: string | null;
  pointsToNextTier: number;
  progress: number;
}

interface Reward {
  id: string;
  type: string;
  amount: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
  expiresAt: string | null;
  claimedAt: string | null;
}

interface LeaderboardEntry {
  userId: string;
  points: number;
  currentTier: string;
  rank?: number;
}

const TIER_CONFIG = {
  bronze: { name: "Bronze", color: "from-amber-600 to-orange-700", icon: Medal, min: 0, max: 999 },
  silver: { name: "Silver", color: "from-gray-300 to-gray-500", icon: Award, min: 1000, max: 4999 },
  gold: { name: "Gold", color: "from-yellow-400 to-yellow-600", icon: Star, min: 5000, max: 14999 },
  platinum: { name: "Platinum", color: "from-cyan-400 to-blue-500", icon: Trophy, min: 15000, max: 49999 },
  diamond: { name: "Diamond", color: "from-purple-400 to-pink-600", icon: Crown, min: 50000, max: Infinity },
};

export default function RewardsPage() {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "leaderboard">("overview");

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const userId = localStorage.getItem("userId") || "demo-user";
      const token = localStorage.getItem("token");

      const [tierRes, rewardsRes, leaderboardRes] = await Promise.all([
        fetch(`http://localhost:4000/api/rewards/tier/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:4000/api/rewards/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:4000/api/rewards/leaderboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (tierRes.ok) {
        const data = await tierRes.json();
        setTierInfo(data);
      }

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching rewards data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`http://localhost:4000/api/rewards/claim/${rewardId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Reward claimed successfully!");
        fetchRewardsData();
      } else {
        alert(data.error || "Failed to claim reward");
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Failed to claim reward");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading rewards...</div>
      </div>
    );
  }

  const currentTier = tierInfo?.tier.currentTier || "bronze";
  const TierIcon = TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG]?.icon || Medal;
  const tierColor = TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG]?.color || "from-gray-500 to-gray-700";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            Rewards & Achievements
          </h1>
          <p className="text-blue-200">Track your progress and earn exclusive rewards</p>
        </motion.div>

        {/* Current Tier Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br ${tierColor} rounded-3xl p-8 mb-8 shadow-2xl border-4 border-white/20`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <TierIcon className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG]?.name || "Bronze"} Tier
                </h2>
                <p className="text-white/80 text-lg">
                  {tierInfo?.tier.points.toLocaleString()} points
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm mb-1">Lifetime Earned</div>
              <div className="text-3xl font-bold text-white">
                ${parseFloat(tierInfo?.tier.lifetimeRewards || "0").toFixed(2)}
              </div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {tierInfo?.nextTier && (
            <div>
              <div className="flex justify-between text-white/90 mb-2 text-sm">
                <span>Progress to {tierInfo.nextTier}</span>
                <span>{tierInfo.pointsToNextTier.toLocaleString()} points to go</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tierInfo.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                />
              </div>
              <div className="text-right text-white/80 text-sm mt-1">
                {tierInfo.progress.toFixed(1)}% complete
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-white/80 text-sm">Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {tierInfo?.tier.streak || 0} days
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-green-400" />
              <span className="text-white/80 text-sm">Longest Streak</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {tierInfo?.tier.longestStreak || 0} days
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-white/80 text-sm">Referrals</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {tierInfo?.tier.totalReferrals || 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-pink-400" />
              <span className="text-white/80 text-sm">Total Points</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {tierInfo?.tier.lifetimePoints.toLocaleString() || 0}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {["overview", "achievements", "leaderboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white text-purple-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Available Rewards
            </h3>
            <div className="space-y-4">
              {rewards.filter(r => r.status === "pending").length === 0 ? (
                <p className="text-blue-200 text-center py-8">
                  No pending rewards. Keep earning to unlock more!
                </p>
              ) : (
                rewards
                  .filter(r => r.status === "pending")
                  .map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">{reward.title}</div>
                          <div className="text-blue-200 text-sm">{reward.description}</div>
                          <div className="text-green-400 text-sm font-semibold mt-1">
                            +{parseFloat(reward.amount).toFixed(2)} tokens
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaimReward(reward.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                      >
                        Claim
                      </button>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "First Transaction", desc: "Complete your first transaction", points: 100, achieved: true },
                { name: "Week Warrior", desc: "7-day login streak", points: 250, achieved: tierInfo?.tier.streak! >= 7 },
                { name: "High Roller", desc: "Transaction over $1000", points: 500, achieved: false },
                { name: "Social Butterfly", desc: "Refer 5 friends", points: 1000, achieved: (tierInfo?.tier.totalReferrals || 0) >= 5 },
                { name: "Token Master", desc: "Earn 10,000 tokens", points: 2000, achieved: (tierInfo?.tier.lifetimePoints || 0) >= 10000 },
                { name: "Diamond Hands", desc: "Reach Diamond tier", points: 5000, achieved: currentTier === "diamond" },
              ].map((achievement, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    achievement.achieved
                      ? "bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-400/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.achieved ? "bg-green-500" : "bg-gray-600"
                    }`}>
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold">{achievement.name}</div>
                      <div className="text-blue-200 text-sm">{achievement.desc}</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-semibold text-sm">
                    {achievement.achieved ? "✓ Unlocked" : `${achievement.points} points`}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Top Players
            </h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        idx === 0
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                          : idx === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                          : idx === 2
                          ? "bg-gradient-to-br from-amber-600 to-orange-700 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        User {entry.userId.substring(0, 8)}...
                      </div>
                      <div className="text-blue-200 text-sm capitalize">
                        {entry.currentTier} Tier
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">
                      {entry.points.toLocaleString()}
                    </div>
                    <div className="text-blue-200 text-sm">points</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
