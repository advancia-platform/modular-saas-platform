"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function SilentModeIndicator() {
  const [silentMode, setSilentMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config/silent-mode")
      .then((res) => res.json())
      .then((data) => {
        const isActive = data.silentMode;
        setSilentMode(isActive);

        if (isActive) {
          // Suppress console logs in silent mode
          console.log("🛑 Silent Mode Active — Backend notifications hidden");
          const noop = () => {};
          console.log = noop;
          console.info = noop;
          console.warn = noop;
          // Keep console.error for critical issues
        } else {
          console.log("✅ Dev Mode — Backend logs visible");
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch silent mode status:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !silentMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <ShieldAlert size={16} />
        <span className="font-medium">Silent Mode</span>
      </div>
    </div>
  );
}
