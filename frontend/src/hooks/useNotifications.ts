import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";

export interface Notification {
  id: string;
  userId: string;
  type: "info" | "success" | "warning" | "error";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  categoryPreferences: Record<string, boolean>;
}

let socketInstance: Socket | null = null;

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!userId) return;

    if (!socketInstance) {
      socketInstance = io(API_URL, {
        transports: ["websocket", "polling"],
      });

      socketInstance.on("connect", () => {
        console.log("✅ Connected to notification socket");
        socketInstance?.emit("join-room", userId);
      });
    }

    const socket = socketInstance;

    socket.on("notification", (notification: Notification) => {
      console.log("📬 Received notification:", notification);
      
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast
      toast(notification.message, {
        type: notification.type === "error" ? "error" : notification.type === "warning" ? "warning" : notification.type === "success" ? "success" : "info",
        autoClose: notification.priority === "urgent" ? false : 5000,
      });
    });

    return () => {
      socket.off("notification");
    };
  }, [userId, API_URL]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  }) => {
    if (!userId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(options?.page || 1),
        limit: String(options?.limit || 20),
        ...(options?.unreadOnly && { unreadOnly: "true" }),
        ...(options?.category && { category: options.category }),
      });

      const response = await fetch(`${API_URL}/api/notifications?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.pagination.unread);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId, API_URL]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [userId, API_URL]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, [API_URL]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  }, [API_URL]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  }, [API_URL]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    }
  }, [userId, API_URL]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        toast.success("Preferences updated");
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    }
  }, [API_URL]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });

      const response = await fetch(`${API_URL}/api/notifications/subscribe-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
          },
          deviceInfo: navigator.userAgent,
        }),
      });

      if (response.ok) {
        toast.success("Push notifications enabled");
      }
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
      toast.error("Failed to enable push notifications");
    }
  }, [API_URL]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
      fetchPreferences();
    }
  }, [userId, fetchNotifications, fetchUnreadCount, fetchPreferences]);

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    subscribeToPush,
  };
};
