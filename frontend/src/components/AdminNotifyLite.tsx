"use client";

import { useEffect, useState } from "react";

interface NotificationStats {
  total: number;
  unread: number;
  failedEmails: number;
  timestamp?: string;
  error?: string;
}

export default function AdminNotifyLite() {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    failedEmails: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/notify/stats`);
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch notification stats:", error);
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.open(`${apiUrl}/api/notify/export`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-4 bg-white shadow rounded-lg border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          📬 Notification Summary
        </h3>
        <button
          onClick={handleExport}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
          title="Download CSV report"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download CSV
        </button>
      </div>

      {stats.error ? (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
          ⚠️ {stats.error}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">📩 Total Notifications</span>
            <span className="font-bold text-lg text-gray-800">{stats.total}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
            <span className="text-sm text-blue-600">🔔 Unread</span>
            <span className="font-bold text-lg text-blue-700">{stats.unread}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-red-50 rounded">
            <span className="text-sm text-red-600">⚠️ Email Failures</span>
            <span className="font-bold text-lg text-red-700">{stats.failedEmails}</span>
          </div>
        </div>
      )}

      {stats.timestamp && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
