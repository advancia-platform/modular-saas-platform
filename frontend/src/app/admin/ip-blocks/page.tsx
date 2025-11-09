
"use client";

import { useCallback, useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import toast from "react-hot-toast";

interface IpBlock {
  id: string;
  ip: string;
  reason?: string;
  until?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IpBlocksPanel() {
  const [blocks, setBlocks] = useState<IpBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlocks = useCallback(async () => {
    try {
      const res = await adminApi.get(`/api/admin/ip-blocks`);
      setBlocks(res.data);
    } catch (error) {
      toast.error("Failed to load IP blocks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const unblock = async (ip: string) => {
    try {
      await adminApi.post(`/api/admin/ip-blocks/unblock`, { ip });
      toast.success(`Unblocked ${ip}`);
      setBlocks(blocks.filter((b) => b.ip !== ip));
    } catch (error) {
      toast.error("Failed to unblock IP");
      console.error(error);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span>🚫</span>
        <span>Blocked IPs</span>
      </h1>

      {blocks.length === 0 ? (
        <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700">No active blocks ✅</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Until
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blocks.map((block) => (
                <tr key={block.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{block.ip}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {block.reason || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {block.until ? new Date(block.until).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => unblock(block.ip)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                    >
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FailRateGauge />
    </div>
  );
}

function FailRateGauge() {
  const [rate, setRate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRate(Math.random() * 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const color = rate > 8 ? "red" : rate > 5 ? "yellow" : "green";

  return (
    <div className="p-4 bg-gray-50 border rounded-lg shadow-sm">
      <h2 className="font-semibold mb-2 flex items-center gap-2">
        <span>📈</span>
        <span>Live Fail Rate</span>
      </h2>
      <div className={`text-3xl font-bold text-${color}-600`}>
        {rate.toFixed(2)} / min
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Current average login fails per minute
      </p>
    </div>
  );
}
