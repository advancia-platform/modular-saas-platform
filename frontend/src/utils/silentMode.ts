/**
 * Silent Mode Utility
 * Suppresses backend notifications and console logs when enabled
 */

let silentModeEnabled = false;

export const initSilentMode = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/admin/config/silent-mode");
    const data = await res.json();

    silentModeEnabled = data.silentMode || false;

    if (silentModeEnabled) {
      // Suppress console methods
      const noop = () => {};
      window.console.log = noop;
      window.console.info = noop;
      window.console.warn = noop;
      window.console.debug = noop;
      // Keep console.error for critical issues

      console.error("🛑 Silent Mode: Backend notifications suppressed");
    }

    return silentModeEnabled;
  } catch (error) {
    console.error("Failed to initialize Silent Mode:", error);
    return false;
  }
};

export const isSilentMode = (): boolean => {
  return silentModeEnabled;
};

export const showToastIfAllowed = (
  toastFn: () => void,
  isBackendError = false
): void => {
  // Only suppress backend errors in silent mode
  if (silentModeEnabled && isBackendError) {
    return; // Suppress
  }
  toastFn(); // Show
};
