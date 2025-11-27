'use client';

import axios from 'axios';
import React, { useEffect, useState } from "react";

const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  withCredentials: true,
});

// Auto-attach JWT from localStorage
backendApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

type ChartPoint = { date: string; revenue: number; users: number; transactions: number };

type DashboardResponse = {
  revenue: { current: number; previous: number; trend: number };
  users: { current: number; previous: number; trend: number };
  transactions: { current: number; previous: number; trend: number };
  conversionRate: { current: number; previous: number; trend: number };
  chartData: ChartPoint[];
};

function KpiCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <p className="text-gray-500">{label}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await backendApi.get<DashboardResponse>("/api/analytics/dashboard");
      setData(res.data);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("You're sending requests too quickly. Please wait a moment.");
      } else if (err.response?.status === 401) {
        setError("Please log in to view analytics.");
      } else {
        setError("Failed to load analytics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="p-6">Loading analytics…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }
  if (!data) {
    return <div className="p-6">No data available.</div>;
  }

  const currency = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Revenue" value={currency(data.revenue.current)} />
        <KpiCard label="Active Users" value={data.users.current} />
        <KpiCard label="Transactions" value={data.transactions.current} />
        <KpiCard label="Conversion Rate" value={`${data.conversionRate.current}%`} />
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Daily Overview</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Revenue</th>
                <th className="p-2">Users</th>
                <th className="p-2">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {data.chartData.map((pt) => (
                <tr key={pt.date} className="border-t">
                  <td className="p-2">{pt.date}</td>
                  <td className="p-2">{currency(pt.revenue)}</td>
                  <td className="p-2">{pt.users}</td>
                  <td className="p-2">{pt.transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
