import prisma from "../prismaClient";
import webpush from "web-push";
import * as nodemailer from "nodemailer";
import { Server as SocketServer } from "socket.io";

// Configure VAPID (will be set from env)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:support@advanciapayledger.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER || ""; // Gmail account used for SMTP auth
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || ""; // Gmail App Password recommended
// Custom From/Reply-To to present your domain (e.g., support@yourdomain)
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || EMAIL_USER;

// Email transporter (Gmail SMTP)
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Socket.io instance (injected from index.ts)
let io: SocketServer | null = null;

export function setSocketIO(socketServer: SocketServer) {
  io = socketServer;
  console.log("✅ Socket.IO injected into notification service");
}

interface NotificationPayload {
  userId: string;
  type?: "email" | "sms" | "in-app" | "push" | "all";
  priority?: "low" | "normal" | "high" | "urgent";
  category: "transaction" | "security" | "system" | "reward" | "admin";
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function createNotification(payload: NotificationPayload) {
  const {
    userId,
    type = "all",
    priority = "normal",
    category,
    title,
    message,
    data,
  } = payload;

  try {
    // Get user preferences
    let userPrefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if none exist
    if (!userPrefs) {
      userPrefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    // Check if category is enabled
    const categoryKey = `${category}Alerts` as keyof typeof userPrefs;
    if (categoryKey in userPrefs && !userPrefs[categoryKey]) {
      console.log(
        `⏭️  Skipping notification - ${category} alerts disabled for user ${userId}`
      );
      return null;
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        priority,
        category,
        title,
        message,
        data: data || {},
      },
    });

    console.log(
      `✅ Notification created: ${notification.id} for user ${userId}`
    );

    // Determine which channels to use
    const channels: string[] = [];
    if (type === "all") {
      if (userPrefs?.emailEnabled) channels.push("email");
      if (userPrefs?.inAppEnabled) channels.push("in-app");
      if (userPrefs?.pushEnabled) channels.push("push");
    } else {
      channels.push(type);
    }

    // Send via each channel (non-blocking)
    Promise.allSettled([
      channels.includes("email")
        ? sendEmail(notification.id, userId, title, message)
        : Promise.resolve(),
      channels.includes("in-app")
        ? sendInApp(notification.id, userId, notification)
        : Promise.resolve(),
      channels.includes("push")
        ? sendPush(notification.id, userId, title, message, data)
        : Promise.resolve(),
    ]).then(async (results) => {
      // Update notification with delivery status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent:
            channels.includes("email") && results[0]?.status === "fulfilled",
          emailSentAt:
            channels.includes("email") && results[0]?.status === "fulfilled"
              ? new Date()
              : undefined,
          pushSent:
            channels.includes("push") && results[2]?.status === "fulfilled",
          pushSentAt:
            channels.includes("push") && results[2]?.status === "fulfilled"
              ? new Date()
              : undefined,
        },
      });
    });

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}

async function sendEmail(
  notificationId: string,
  userId: string,
  subject: string,
  message: string
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) {
      console.warn(`⚠️  No email found for user ${userId}`);
      return;
    }

    await emailTransporter.sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: user.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #3B82F6; margin-top: 0;">${subject}</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">${message}</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6B7280;">
              This is an automated notification from Advancia Pay Ledger.
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:3000"
              }/settings/notifications" style="color: #3B82F6; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      `,
    });

    await logDelivery(notificationId, "email", "sent");
    console.log(`✅ Email sent to ${user.email}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await logDelivery(notificationId, "email", "failed", errorMsg);
    console.error("❌ Email send failed:", error);
  }
}

async function sendInApp(
  notificationId: string,
  userId: string,
  notification: any
) {
  try {
    if (!io) {
      console.warn("⚠️  Socket.IO not initialized");
      return;
    }

    // Emit to user's room (convention: user-${userId})
    io.to(`user-${userId}`).emit("notification", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      createdAt: notification.createdAt,
    });

    console.log(`✅ In-app notification sent to user ${userId}`);
  } catch (error) {
    console.error("❌ In-app notification failed:", error);
  }
}

async function sendPush(
  notificationId: string,
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("⚠️  VAPID keys not configured, skipping push notification");
      return;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId, isActive: true },
    });

    if (subscriptions.length === 0) {
      console.log(`ℹ️  No active push subscriptions for user ${userId}`);
      return;
    }

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title,
            body: message,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            data: { notificationId, ...data },
          })
        );
        await logDelivery(notificationId, "push", "sent");
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription expired
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          });
          console.log(
            `🗑️  Removed expired push subscription for user ${userId}`
          );
        }
        throw error;
      }
    });

    await Promise.allSettled(pushPromises);
    console.log(
      `✅ Push notifications sent to ${subscriptions.length} device(s)`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await logDelivery(notificationId, "push", "failed", errorMsg);
    console.error("❌ Push notification failed:", error);
  }
}

async function logDelivery(
  notificationId: string,
  channel: string,
  status: string,
  errorMessage?: string
) {
  try {
    await prisma.notificationLog.create({
      data: {
        notificationId,
        channel,
        status,
        errorMessage,
        deliveredAt: status === "sent" ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.error("❌ Failed to log delivery:", error);
  }
}

// Email fallback for unread notifications
export async function sendFallbackEmails() {
  const delay = parseInt(process.env.EMAIL_FALLBACK_DELAY || "10");
  const cutoff = new Date(Date.now() - delay * 60 * 1000);

  try {
    const unread = await prisma.notification.findMany({
      where: {
        isRead: false,
        createdAt: { lt: cutoff },
        emailSent: false,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
      },
      take: 50, // Limit to prevent overwhelming
    });

    if (unread.length === 0) {
      return;
    }

    console.log(`📧 Sending ${unread.length} fallback email(s)...`);

    for (const notification of unread) {
      // Fetch user email separately
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true },
      });

      if (!user?.email) continue;

      try {
        await emailTransporter.sendMail({
          from: EMAIL_FROM,
          replyTo: EMAIL_REPLY_TO,
          to: user.email,
          subject: `⚠️ Unread Notification: ${notification.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FEF3C7;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; border-left: 4px solid #F59E0B;">
                <h2 style="color: #F59E0B; margin-top: 0;">📬 You have an unread notification</h2>
                <p><strong>${notification.title}</strong></p>
                <p style="color: #374151; line-height: 1.6;">${
                  notification.message
                }</p>
                <a href="${
                  process.env.FRONTEND_URL || "http://localhost:3000"
                }/notifications" 
                   style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                  View Notification
                </a>
              </div>
            </div>
          `,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSent: true, emailSentAt: new Date() },
        });

        console.log(`📧 Fallback email sent to ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Fallback email failed for notification ${notification.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in fallback email job:", error);
  }
}

// Get user notifications with pagination
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {}
) {
  const { page = 1, limit = 20, unreadOnly = false, category } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) where.isRead = false;
  if (category) where.category = category;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + limit < total,
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const updated = await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
  try {
    if (io) {
      const unread = await getUnreadCount(userId);
      io.to(`user-${userId}`).emit("notifications:read", {
        id: notificationId,
      });
      io.to(`user-${userId}`).emit("notifications:unread-count", {
        count: unread,
      });
    }
  } catch (e) {
    console.warn("Socket emit failed for markAsRead:", e);
  }
  return updated;
}

export async function markAllAsRead(userId: string) {
  const res = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  try {
    if (io) {
      io.to(`user-${userId}`).emit("notifications:all-read");
      io.to(`user-${userId}`).emit("notifications:unread-count", { count: 0 });
    }
  } catch (e) {
    console.warn("Socket emit failed for markAllAsRead:", e);
  }
  return res;
}

export async function getUnreadCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  return await prisma.notification.delete({
    where: { id: notificationId, userId },
  });
}

export async function getUserPreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: { userId },
    });
  }

  return prefs;
}

export async function updateUserPreferences(userId: string, updates: any) {
  return await prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates },
  });
}

/**
 * Notify all admin users
 * @param payload - Notification payload (userId will be ignored, all admins will be notified)
 */
export async function notifyAllAdmins(
  payload: Omit<NotificationPayload, "userId">
) {
  try {
    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (adminUsers.length === 0) {
      console.log("⚠️  No admin users found to notify");
      return [];
    }

    console.log(`📢 Notifying ${adminUsers.length} admin users`);

    // Send notification to each admin
    const notifications = await Promise.allSettled(
      adminUsers.map((admin) =>
        createNotification({
          ...payload,
          userId: admin.id,
        })
      )
    );

    // Also send to admins room via Socket.IO
    if (io) {
      io.to("admins").emit("admin-notification", {
        title: payload.title,
        message: payload.message,
        priority: payload.priority,
        category: payload.category,
        data: payload.data,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ Socket notification sent to admins room");
    }

    return notifications;
  } catch (error) {
    console.error("❌ Error notifying admins:", error);
    throw error;
  }
}
