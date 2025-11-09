"use client";

import { useEffect } from "react";

/**
 * Silent Mode Provider
 * Checks backend configuration and enables Silent Mode globally
 * - Suppresses console logs in production
 * - Sets window.__SILENT_MODE__ flag for toast wrapper
 * - Fetches config on app mount
 */
export default function SilentModeProvider() {
  useEffect(() => {
    const checkSilentMode = async () => {
      try {
        const response = await fetch("/api/admin/config/silent-mode", {
          credentials: "include",
        });

        if (!response.ok) {
          console.warn(
            "[Silent Mode] Failed to fetch config, defaulting to disabled"
          );
          return;
        }

        const data = await response.json();

        if (data.silentMode) {
          // Set global flag for toast wrapper
          if (typeof window !== "undefined") {
            window.__SILENT_MODE__ = true;
          }

          // Suppress console logs in production
          if (process.env.NODE_ENV === "production") {
            const noop = () => {};
            console.log = noop;
            console.info = noop;
            console.warn = noop;
            // Keep console.error for critical debugging
          }

          console.log("🔇 Silent Mode activated");
        } else {
          if (typeof window !== "undefined") {
            window.__SILENT_MODE__ = false;
          }
        }
      } catch (error) {
        console.error("[Silent Mode] Error checking configuration:", error);
        // Default to not enabled on error
        if (typeof window !== "undefined") {
          window.__SILENT_MODE__ = false;
        }
      }
    };

    checkSilentMode();
  }, []);

  // This component doesn't render anything
  return null;
}
