"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HealthDashboardProps {
  userId: string;
}

interface HealthReading {
  id: string;
  heartRate: number | null;
  bloodPressureSys: number | null;
  bloodPressureDia: number | null;
  steps: number | null;
  sleepHours: number | null;
  sleepQuality: string | null;
  weight: number | null;
  temperature: number | null;
  oxygenLevel: number | null;
  stressLevel: string | null;
  mood: string | null;
  recordedAt: string;
}

interface HealthSummary {
  period: string;
  count: number;
  healthScore: number;
  averages: {
    heartRate: number | null;
    bloodPressure: string | null;
    steps: number | null;
    totalSteps: number;
    sleepHours: string | null;
    weight: string | null;
    oxygenLevel: number | null;
  };
  mostCommonMood: string | null;
}

interface Alert {
  type: "warning" | "info";
  metric: string;
  message: string;
  value: string;
  normal: string;
}

export default function HealthDashboard({ userId }: HealthDashboardProps) {
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [latestReading, setLatestReading] = useState<HealthReading | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReading, setShowAddReading] = useState(false);
  const [newReading, setNewReading] = useState({
    heartRate: "",
    bloodPressureSys: "",
    bloodPressureDia: "",
    steps: "",
    sleepHours: "",
    weight: "",
    temperature: "",
    oxygenLevel: "",
    mood: "good",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/health/summary/${userId}?days=30`);
      const data = await res.json();
      // Ensure data is a valid summary object
      if (data && typeof data === 'object' && data.averages) {
        setSummary(data);
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchLatestReading = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/health/latest/${userId}`);
      const data = await res.json();
      // Ensure reading exists and has required properties
      if (data && data.reading && typeof data.reading === 'object') {
        setLatestReading(data.reading);
      } else {
        setLatestReading(null);
      }
    } catch (error) {
      console.error("Error fetching latest reading:", error);
      setLatestReading(null);
    }
  }, [userId]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/health/alerts/${userId}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, [userId]);

  useEffect(() => {
    void fetchSummary();
    void fetchLatestReading();
    void fetchAlerts();
  }, [fetchSummary, fetchLatestReading, fetchAlerts]);

  const handleAddReading = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/health/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          heartRate: newReading.heartRate || null,
          bloodPressureSys: newReading.bloodPressureSys || null,
          bloodPressureDia: newReading.bloodPressureDia || null,
          steps: newReading.steps || null,
          sleepHours: newReading.sleepHours || null,
          weight: newReading.weight || null,
          temperature: newReading.temperature || null,
          oxygenLevel: newReading.oxygenLevel || null,
          mood: newReading.mood,
          deviceType: "manual",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Health data recorded!" });
        setShowAddReading(false);
        setNewReading({
          heartRate: "",
          bloodPressureSys: "",
          bloodPressureDia: "",
          steps: "",
          sleepHours: "",
          weight: "",
          temperature: "",
          oxygenLevel: "",
          mood: "good",
        });
        fetchSummary();
        fetchLatestReading();
        fetchAlerts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to record data" });
      }
    } catch (error: unknown) {
      console.error("Error recording health data:", error);
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "from-green-400 to-emerald-600";
    if (score >= 60) return "from-yellow-400 to-amber-600";
    return "from-red-400 to-rose-600";
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
      {/* Health Score Card */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${getHealthScoreColor(summary.healthScore)} rounded-2xl p-8 text-white shadow-2xl`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Health Score</h2>
              <p className="text-6xl font-bold">{summary.healthScore}</p>
              <p className="text-sm opacity-90 mt-2">{summary.period}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddReading(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              + Add Reading
            </motion.button>
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

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl border-l-4 ${
                alert.type === "warning"
                  ? "bg-red-50 border-red-500 text-red-800"
                  : "bg-blue-50 border-blue-500 text-blue-800"
              }`}
            >
              <p className="font-semibold">{alert.message}</p>
              <p className="text-sm">
                Current: {alert.value} | Normal: {alert.normal}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Vital Stats Grid */}
      {summary && summary.averages && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.averages.heartRate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">❤️</div>
              <p className="text-3xl font-bold text-navy">{summary.averages.heartRate}</p>
              <p className="text-sm text-gray-600">Avg Heart Rate</p>
              <p className="text-xs text-gray-400">bpm</p>
            </motion.div>
          )}

          {summary.averages.bloodPressure && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">🩺</div>
              <p className="text-3xl font-bold text-navy">{summary.averages.bloodPressure}</p>
              <p className="text-sm text-gray-600">Avg Blood Pressure</p>
              <p className="text-xs text-gray-400">mmHg</p>
            </motion.div>
          )}

          {summary.averages.steps && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">👟</div>
              <p className="text-3xl font-bold text-navy">{summary.averages.steps.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Avg Daily Steps</p>
              <p className="text-xs text-gray-400">{summary.averages.totalSteps.toLocaleString()} total</p>
            </motion.div>
          )}

          {summary.averages.sleepHours && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">😴</div>
              <p className="text-3xl font-bold text-navy">{summary.averages.sleepHours}h</p>
              <p className="text-sm text-gray-600">Avg Sleep</p>
              <p className="text-xs text-gray-400">per night</p>
            </motion.div>
          )}

          {summary.averages.weight && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">⚖️</div>
              <p className="text-3xl font-bold text-navy">{summary.averages.weight}</p>
              <p className="text-sm text-gray-600">Avg Weight</p>
              <p className="text-xs text-gray-400">kg</p>
            </motion.div>
          )}

          {summary.averages.oxygenLevel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">🫁</div>
              <p className="text-3xl font-bold text-navy">{summary.averages.oxygenLevel}%</p>
              <p className="text-sm text-gray-600">Avg Oxygen</p>
              <p className="text-xs text-gray-400">SpO2</p>
            </motion.div>
          )}

          {summary.mostCommonMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="text-4xl mb-2">
                {summary.mostCommonMood === "great" ? "😄" : summary.mostCommonMood === "good" ? "🙂" : "😐"}
              </div>
              <p className="text-3xl font-bold text-navy capitalize">{summary.mostCommonMood}</p>
              <p className="text-sm text-gray-600">Common Mood</p>
              <p className="text-xs text-gray-400">this month</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="text-4xl mb-2">📊</div>
            <p className="text-3xl font-bold text-navy">{summary.count}</p>
            <p className="text-sm text-gray-600">Total Readings</p>
            <p className="text-xs text-gray-400">{summary.period}</p>
          </motion.div>
        </div>
      )}

      {/* Latest Reading */}
      {latestReading && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-navy mb-4">Latest Reading</h3>
          <p className="text-sm text-gray-500 mb-4">{new Date(latestReading.recordedAt).toLocaleString()}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latestReading.heartRate && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600">Heart Rate</p>
                <p className="text-lg font-bold text-navy">{latestReading.heartRate} bpm</p>
              </div>
            )}
            {latestReading.bloodPressureSys && latestReading.bloodPressureDia && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Blood Pressure</p>
                <p className="text-lg font-bold text-navy">
                  {latestReading.bloodPressureSys}/{latestReading.bloodPressureDia}
                </p>
              </div>
            )}
            {latestReading.steps && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600">Steps</p>
                <p className="text-lg font-bold text-navy">{latestReading.steps.toLocaleString()}</p>
              </div>
            )}
            {latestReading.oxygenLevel && (
              <div className="p-3 bg-cyan-50 rounded-lg">
                <p className="text-xs text-gray-600">Oxygen Level</p>
                <p className="text-lg font-bold text-navy">{latestReading.oxygenLevel}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Reading Modal */}
      <AnimatePresence>
        {showAddReading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddReading(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-navy mb-6">Add Health Reading</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={newReading.heartRate}
                    onChange={(e) => setNewReading({ ...newReading, heartRate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newReading.bloodPressureSys}
                      onChange={(e) => setNewReading({ ...newReading, bloodPressureSys: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="120"
                    />
                    <span className="flex items-center">/</span>
                    <input
                      type="number"
                      value={newReading.bloodPressureDia}
                      onChange={(e) => setNewReading({ ...newReading, bloodPressureDia: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="80"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                  <input
                    type="number"
                    value={newReading.steps}
                    onChange={(e) => setNewReading({ ...newReading, steps: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="8000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.sleepHours}
                    onChange={(e) => setNewReading({ ...newReading, sleepHours: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="7.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.weight}
                    onChange={(e) => setNewReading({ ...newReading, weight: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReading.temperature}
                    onChange={(e) => setNewReading({ ...newReading, temperature: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="36.6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oxygen Level (%)</label>
                  <input
                    type="number"
                    value={newReading.oxygenLevel}
                    onChange={(e) => setNewReading({ ...newReading, oxygenLevel: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="98"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
                  <select
                    value={newReading.mood}
                    onChange={(e) => setNewReading({ ...newReading, mood: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="great">😄 Great</option>
                    <option value="good">🙂 Good</option>
                    <option value="okay">😐 Okay</option>
                    <option value="bad">😟 Bad</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddReading}
                  className="flex-1 bg-gold hover:bg-amber-500 text-navy py-3 rounded-xl font-semibold transition-colors"
                >
                  Save Reading
                </button>
                <button
                  onClick={() => setShowAddReading(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
