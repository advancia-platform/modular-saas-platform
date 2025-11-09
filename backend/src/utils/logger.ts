import { Request } from "express";
import prisma from "../prismaClient";

/**
 * Log admin login attempts for security auditing
 */
export async function logAdminLogin(
  req: Request,
  email: string,
  status: "SUCCESS" | "FAILED_PASSWORD" | "FAILED_OTP" | "OTP_SENT",
  phone?: string
): Promise<void> {
  try {
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await prisma.adminLoginLog.create({
      data: {
        email,
        phone,
        status,
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
        userAgent,
      },
    });

    console.log(`🔐 Admin login attempt logged: ${email} - ${status}`);
  } catch (error) {
    console.error("❌ Failed to log admin login attempt:", error);
    // Don't throw - logging shouldn't break the auth flow
  }
}
