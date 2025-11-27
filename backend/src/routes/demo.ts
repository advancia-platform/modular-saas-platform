/**
 * Demo routes for testing enhanced authentication and permissions
 * These routes demonstrate the permission-based access control system
 */

import express, { Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { verifyAccess, verifyAllAccess } from "../middleware/permissions";
import { AuthenticatedRequest } from "../middleware/rbac";

const router = express.Router();

/**
 * Public test route (no authentication required)
 */
router.get("/public", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Public endpoint accessible to everyone",
    timestamp: new Date().toISOString(),
    public: true,
  });
});

/**
 * Basic authenticated route (any valid token)
 */
router.get(
  "/authenticated",
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Authenticated endpoint",
      user: {
        id: req.user?.userId,
        email: req.user?.email,
        role: req.user?.role,
      },
      timestamp: new Date().toISOString(),
    });
  },
);

/**
 * Permission-based routes
 */

// Read accounts permission required
router.get(
  "/accounts",
  authenticateToken,
  verifyAccess(["read:accounts"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Account data access granted",
      permissions: req.matchedPermissions,
      data: {
        accounts: [
          { id: 1, name: "Test Account 1", balance: 100.0 },
          { id: 2, name: "Test Account 2", balance: 250.5 },
        ],
      },
      timestamp: new Date().toISOString(),
    });
  },
);

// Write transactions permission required
router.post(
  "/transactions",
  authenticateToken,
  verifyAccess(["write:transactions"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Transaction created successfully",
      permissions: req.matchedPermissions,
      data: {
        transaction: {
          id: Date.now(),
          amount: req.body.amount || 0,
          description: req.body.description || "Test transaction",
          timestamp: new Date().toISOString(),
        },
      },
    });
  },
);

// Multiple permissions (OR logic) - needs read:accounts OR write:transactions
router.get(
  "/accounts-or-transactions",
  authenticateToken,
  verifyAccess(["read:accounts", "write:transactions"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Access granted via OR permissions",
      permissions: req.matchedPermissions,
      logic: "OR",
      required: ["read:accounts", "write:transactions"],
      timestamp: new Date().toISOString(),
    });
  },
);

// Multiple permissions (AND logic) - needs read:accounts AND write:transactions
router.get(
  "/accounts-and-transactions",
  authenticateToken,
  verifyAllAccess(["read:accounts", "write:transactions"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Access granted via AND permissions",
      permissions: req.matchedPermissions,
      logic: "AND",
      required: ["read:accounts", "write:transactions"],
      timestamp: new Date().toISOString(),
    });
  },
);

// Admin-only route
router.get(
  "/admin-data",
  authenticateToken,
  verifyAccess(["admin:users"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Admin data access granted",
      permissions: req.matchedPermissions,
      data: {
        users: [
          { id: 1, email: "user1@example.com", role: "USER", active: true },
          { id: 2, email: "user2@example.com", role: "STAFF", active: true },
        ],
        stats: {
          totalUsers: 2,
          activeUsers: 2,
          inactiveUsers: 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  },
);

// Super admin only route
router.get(
  "/superadmin-data",
  authenticateToken,
  verifyAccess(["*:*"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Super admin access granted",
      permissions: req.matchedPermissions,
      data: {
        system: {
          version: "1.0.0",
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      },
      timestamp: new Date().toISOString(),
    });
  },
);

// Route to show user's effective permissions
router.get(
  "/my-permissions",
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    // Import here to avoid circular dependency
    const { getRolePermissions } = require("../middleware/permissions");

    const rolePermissions = getRolePermissions(req.user?.role || "USER");
    const userPermissions = req.user?.permissions || [];

    res.json({
      success: true,
      message: "User permissions retrieved",
      user: {
        id: req.user?.userId,
        email: req.user?.email,
        role: req.user?.role,
      },
      permissions: {
        role: req.user?.role,
        rolePermissions,
        userSpecificPermissions: userPermissions,
        allPermissions: [...rolePermissions, ...userPermissions],
      },
      timestamp: new Date().toISOString(),
    });
  },
);

/**
 * Test route for smoke testing - used by the comprehensive test suite
 */
router.get(
  "/protected",
  authenticateToken,
  verifyAccess(["read:accounts", "write:transactions"]),
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Access granted to protected resource",
      user: {
        id: req.user?.userId,
        email: req.user?.email,
        role: req.user?.role,
      },
      permissions: req.matchedPermissions,
      timestamp: new Date().toISOString(),
    });
  },
);

export default router;
