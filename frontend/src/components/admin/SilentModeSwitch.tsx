"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface SilentModeConfig {
  silentMode: boolean;
  autoEnabled: boolean;
  environment: string;
  platform: string;
}

export default function SilentModeSwitch() {
  const [config, setConfig] = useState<SilentModeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config/silent-mode");
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to fetch silent mode config:", error);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const toggleSilentMode = async (enabled: boolean) => {
    if (config?.autoEnabled && !enabled) {
      toast.error(
        "Cannot disable Silent Mode in production. This is enforced for security."
      );
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/config/silent-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfig((prev) => (prev ? { ...prev, silentMode: enabled } : null));
        toast.success(`Silent Mode ${enabled ? "Activated" : "Deactivated"}`);

        // Reload page to apply changes
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.message || "Failed to update configuration");
      }
    } catch (error) {
      console.error("Failed to update silent mode:", error);
      toast.error("Failed to update configuration");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-card border p-4 rounded-lg">
        <Loader2 className="animate-spin mr-2" size={20} />
        <span>Loading configuration...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <p className="text-red-600">Failed to load configuration</p>
      </div>
    );
  }

  const isEnabled = config.silentMode;
  const isLocked = config.autoEnabled;

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert
              size={20}
              className={isEnabled ? "text-yellow-500" : "text-gray-400"}
            />
            <h3 className="text-lg font-semibold">Silent Mode</h3>
            {isLocked && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                Auto-Enabled
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            When enabled, all backend system notifications, debug logs, and
            error toasts are hidden from the frontend. This provides a clean
            user experience in production.
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          aria-label={`Toggle Silent Mode ${isEnabled ? 'off' : 'on'}`}
          onClick={() => toggleSilentMode(!isEnabled)}
          disabled={updating || isLocked}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${isEnabled ? "bg-yellow-500" : "bg-gray-200 dark:bg-gray-700"}
            ${
              updating || isLocked
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }
          `}
        >
          <span
            className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isEnabled ? "translate-x-6" : "translate-x-1"}
          `}
          />
        </button>
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p
            className={`text-sm font-medium ${
              isEnabled ? "text-yellow-600" : "text-gray-600"
            }`}
          >
            {isEnabled ? "Active" : "Inactive"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Environment</p>
          <p className="text-sm font-medium capitalize">{config.environment}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Platform</p>
          <p className="text-sm font-medium capitalize">{config.platform}</p>
        </div>
      </div>

      {/* Warning for Production */}
      {isLocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
          <p className="text-xs text-yellow-800">
            <strong>Production Mode:</strong> Silent Mode is automatically
            enabled and cannot be disabled on Render production for security and
            user experience.
          </p>
        </div>
      )}

      {/* What Gets Suppressed */}
      <details className="mt-4">
        <summary className="text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-700">
          What gets suppressed?
        </summary>
        <ul className="mt-2 text-sm text-muted-foreground space-y-1 ml-4 list-disc">
          <li>Backend error toasts (transaction failures, API errors)</li>
          <li>Debug console.log statements</li>
          <li>System maintenance notifications</li>
          <li>Developer warnings and stack traces</li>
          <li>Database query logs</li>
        </ul>
      </details>
    </div>
  );
}
