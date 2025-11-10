"use client";

import { useState, useEffect } from "react";

interface Tier {
  tier: string;
  currentTier?: string;
  xp: number;
  nextTier: string;
  xpForNext: number;
  multiplier: number;
  totalTokens?: number;
  tokensUntilNextTier?: number;
  benefits?: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  requirement?: number;
  reward?: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  tier: string;
  tokens?: number;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  reward: number;
  deadline: string;
  completed: boolean;
  progress?: number;
  target?: number;
  progressPercent?: number;
}

interface Referral {
  code: string;
  referrals: number;
  earnings: number;
  referralLink?: string;
  reward?: number;
}

export default function GamificationPage() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [referral, setReferral] = useState<Referral | null>(null);
  const [activeTab, setActiveTab] = useState("tier");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTier();
    fetchAchievements();
    fetchLeaderboard();
    fetchChallenges();
  }, []);

  const fetchTier = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/tier", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTier(data);
    } catch (error) {
      console.error("Fetch tier error:", error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/achievements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAchievements(data.achievements);
    } catch (error) {
      console.error("Fetch achievements error:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/leaderboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error("Fetch leaderboard error:", error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/challenges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setChallenges(data.challenges);
    } catch (error) {
      console.error("Fetch challenges error:", error);
    }
  };

  const generateReferral = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/referral", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReferral(data);
    } catch (error) {
      console.error("Generate referral error:", error);
    }
    setLoading(false);
  };

  const claimDailyBonus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/gamification/daily-bonus", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchTier();
    } catch {
      alert("Failed to claim bonus");
    }
    setLoading(false);
  };

  const getTierColor = (tierName: string) => {
    const colors: Record<string, string> = {
      BRONZE: "from-amber-700 to-amber-900",
      SILVER: "from-gray-400 to-gray-600",
      GOLD: "from-yellow-400 to-yellow-600",
      PLATINUM: "from-cyan-400 to-cyan-600",
      DIAMOND: "from-blue-400 to-purple-600",
    };
    return colors[tierName] || colors.BRONZE;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Rewards & Achievements
          </h1>
          <button
            onClick={claimDailyBonus}
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
          >
            {loading ? "Claiming..." : "🎁 Claim Daily Bonus"}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              {["tier", "achievements", "leaderboard", "challenges", "referral"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? "border-b-2 border-purple-500 text-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Tier Tab */}
            {activeTab === "tier" && tier && (
              <div className="space-y-6">
                <div className={`bg-gradient-to-r ${getTierColor(tier.currentTier || 'BRONZE')} p-6 sm:p-8 rounded-xl text-white`}>
                  <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-2">{tier.currentTier}</h2>
                    <p className="text-lg sm:text-xl opacity-90">Reward Multiplier: {tier.multiplier}x</p>
                    <p className="text-sm sm:text-base opacity-75 mt-2">{tier.totalTokens?.toLocaleString() || 0} Total Tokens</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6">
                    <h3 className="font-semibold text-lg mb-4">Current Benefits</h3>
                    <ul className="space-y-2">
                      {tier.benefits?.map((benefit: string, i: number) => (
                        <li key={i} className="flex items-center text-sm sm:text-base">
                          <span className="text-green-500 mr-2">✓</span>
                          {benefit}
                        </li>
                      )) || <li className="text-gray-500">No benefits listed</li>}
                    </ul>
                  </div>

                  {tier.nextTier && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6">
                      <h3 className="font-semibold text-lg mb-4">Next Tier: {tier.nextTier}</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span className="font-semibold">
                              {(tier.tokensUntilNextTier ?? 0) > 0
                                ? `${tier.tokensUntilNextTier?.toLocaleString() || 0} tokens to go`
                                : "Unlocked!"}
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (((tier.totalTokens ?? 0) / ((tier.totalTokens ?? 0) + (tier.tokensUntilNextTier ?? 1))) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`rounded-xl p-4 sm:p-6 border-2 transition ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-500"
                        : "bg-gray-50 border-gray-200 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl sm:text-4xl">
                        {achievement.unlocked ? "🏆" : "🔒"}
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                        +{achievement.reward}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-2">{achievement.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">{achievement.description}</p>
                    {!achievement.unlocked && (
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-600 mb-1">
                          Progress: {achievement.progress ?? 0} / {achievement.id.split("_")[1] || 1}
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{
                              width: `${Math.min(100, ((achievement.progress ?? 0) / (parseInt(achievement.id.split("_")[1]) || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <div className="space-y-3">
                {leaderboard.slice(0, 20).map((user, index) => (
                  <div
                    key={user.userId}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                      index < 3
                        ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="text-xl sm:text-2xl font-bold w-8 sm:w-10 flex-shrink-0">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${user.rank}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{user.name}</div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTierColor(user.tier)} text-white`}>
                            {user.tier}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-bold text-sm sm:text-lg text-purple-600">{user.tokens?.toLocaleString() || 0}</div>
                      <div className="text-xs text-gray-500">tokens</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Challenges Tab */}
            {activeTab === "challenges" && (
              <div className="space-y-4 sm:space-y-6">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold mb-2">{challenge.name}</h3>
                        <p className="text-sm sm:text-base text-gray-600">{challenge.description}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base whitespace-nowrap">
                        +{challenge.reward} tokens
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="font-semibold">
                          {challenge.progress} / {challenge.target}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            challenge.completed
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : "bg-gradient-to-r from-blue-500 to-purple-500"
                          }`}
                          style={{ width: `${challenge.progressPercent}%` }}
                        />
                      </div>
                      {challenge.completed && (
                        <p className="text-green-600 font-semibold mt-2 text-sm sm:text-base">✓ Completed!</p>
                      )}
                      {challenge.deadline && !challenge.completed && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">
                          Expires: {new Date(challenge.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Referral Tab */}
            {activeTab === "referral" && (
              <div className="space-y-6">
                {!referral ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-5xl sm:text-6xl mb-4">🎁</div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Invite Friends, Earn Rewards!</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6">
                      Earn 500 tokens for every friend who signs up using your referral link
                    </p>
                    <button
                      onClick={generateReferral}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 sm:px-8 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50 text-sm sm:text-base"
                    >
                      {loading ? "Generating..." : "Generate Referral Link"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6">
                      <h3 className="font-semibold text-base sm:text-lg mb-3">Your Referral Link</h3>
                      <div className="bg-white border-2 border-purple-300 rounded-lg p-3 sm:p-4 mb-4">
                        <code className="text-xs sm:text-sm break-all">{referral.referralLink}</code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referral.referralLink || "");
                          alert("Copied to clipboard!");
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 sm:py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition text-sm sm:text-base"
                      >
                        📋 Copy Link
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">
                          {referral.referrals}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600">Total Referrals</div>
                      </div>
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                          {referral.referrals * (referral.reward ?? 0)}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600">Tokens Earned</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
