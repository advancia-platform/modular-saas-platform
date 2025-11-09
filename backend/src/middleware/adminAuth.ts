import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware to verify admin access via x-admin-key header
 * Compares against ADMIN_KEY environment variable
 */
export const adminAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey) {
    res.status(500).json({
      error: "Server configuration error: ADMIN_KEY not set",
    });
    return;
  }

  if (!adminKey || adminKey !== expectedKey) {
    res.status(403).json({
      error: "Forbidden: Invalid or missing admin key",
    });
    return;
  }

  next();
};

/**
 * Middleware to require admin JWT token
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    (req as any).user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional: Combined admin auth that also checks JWT for admin role
 * Use this if you want both x-admin-key AND valid admin JWT
 */
export const adminAuthWithToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const adminKey = req.headers["x-admin-key"];
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey) {
    res.status(500).json({
      error: "Server configuration error: ADMIN_KEY not set",
    });
    return;
  }

  if (!adminKey || adminKey !== expectedKey) {
    res.status(403).json({
      error: "Forbidden: Invalid or missing admin key",
    });
    return;
  }

  // Check if user has admin role from JWT (if authenticateToken was applied before)
  const user = (req as any).user;
  if (user && user.role !== "ADMIN") {
    res.status(403).json({
      error: "Forbidden: Admin role required",
    });
    return;
  }

  next();
};
