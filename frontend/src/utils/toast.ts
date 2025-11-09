import toast from "react-hot-toast";

/**
 * Toast notification wrapper with Silent Mode support
 * Automatically suppresses non-admin notifications when Silent Mode is active
 *
 * Usage:
 *   import { showToast } from '@/utils/toast';
 *   showToast.success('Operation successful');
 *   showToast.error('Something went wrong');
 */

declare global {
  interface Window {
    __SILENT_MODE__?: boolean;
  }
}

export const showToast = {
  /**
   * Show success toast
   * Suppressed in Silent Mode unless message contains 'Admin'
   */
  success: (message: string, options?: any) => {
    if (
      typeof window !== "undefined" &&
      window.__SILENT_MODE__ &&
      !message.includes("Admin")
    ) {
      console.log("[Silent Mode] Suppressed success toast:", message);
      return;
    }
    toast.success(message, options);
  },

  /**
   * Show error toast
   * Suppressed in Silent Mode, but logged to console
   */
  error: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.__SILENT_MODE__) {
      console.error("[Silent Mode] Suppressed error toast:", message);
      return;
    }
    toast.error(message, options);
  },

  /**
   * Show info toast
   * Suppressed in Silent Mode
   */
  info: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.__SILENT_MODE__) {
      console.info("[Silent Mode] Suppressed info toast:", message);
      return;
    }
    toast(message, options);
  },

  /**
   * Show warning toast
   * Suppressed in Silent Mode
   */
  warning: (message: string, options?: any) => {
    if (typeof window !== "undefined" && window.__SILENT_MODE__) {
      console.warn("[Silent Mode] Suppressed warning toast:", message);
      return;
    }
    toast(message, {
      icon: "⚠️",
      ...options,
    });
  },

  /**
   * Show loading toast
   * NOT suppressed by Silent Mode (critical UX)
   */
  loading: (message: string, options?: any) => {
    return toast.loading(message, options);
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Show promise toast (automatically handles loading/success/error states)
   * Respects Silent Mode for success/error states
   */
  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string;
      error: string;
    },
    options?: any
  ) => {
    if (typeof window !== "undefined" && window.__SILENT_MODE__) {
      // In Silent Mode, only show loading, suppress success/error
      const loadingToast = toast.loading(msgs.loading);
      return promise
        .then((result) => {
          toast.dismiss(loadingToast);
          console.log("[Silent Mode] Suppressed success:", msgs.success);
          return result;
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          console.error("[Silent Mode] Suppressed error:", msgs.error, error);
          throw error;
        });
    }
    return toast.promise(promise, msgs, options);
  },
};

export default showToast;
