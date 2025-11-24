import { z } from "zod";

export const WithdrawalRequestSchema = z
  .object({
    balanceType: z
      .string()
      .transform((s) => s.toUpperCase())
      .refine((v) => ["USD", "BTC", "ETH", "USDT"].includes(v), {
        message: "balanceType must be USD, BTC, ETH, or USDT",
      }),
    amount: z
      .union([z.number(), z.string()])
      .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
      .refine((n) => !isNaN(n) && n > 0, {
        message: "amount must be a positive number",
      }),
    withdrawalAddress: z
      .string()
      .min(1, "withdrawalAddress is required")
      .optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    const needsAddress = ["BTC", "ETH", "USDT"].includes(val.balanceType);
    if (needsAddress && !val.withdrawalAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["withdrawalAddress"],
        message: "withdrawalAddress is required for crypto withdrawals",
      });
    }
  });

export const WithdrawalAdminActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNotes: z.string().max(2000).optional(),
  txHash: z.string().max(200).optional(),
  networkFee: z
    .union([z.number(), z.string()])
    .transform((v) =>
      v === undefined || v === null || v === ""
        ? undefined
        : typeof v === "string"
          ? parseFloat(v)
          : v,
    )
    .refine(
      (v) => v === undefined || (!isNaN(v as number) && (v as number) >= 0),
      {
        message: "networkFee must be a non-negative number",
      },
    )
    .optional(),
});

export type WithdrawalRequestInput = z.infer<typeof WithdrawalRequestSchema>;
export type WithdrawalAdminActionInput = z.infer<
  typeof WithdrawalAdminActionSchema
>;

// Auth schemas
export const AuthRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

export const AuthLoginSchema = z.object({
  // Accept username or email in the same field
  email: z.string().min(1, "email or username is required"),
  password: z.string().min(1, "password is required"),
});

// Payments schemas
export const PaymentSaveMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

export const PaymentCreateIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const PaymentChargeSavedSchema = z.object({
  paymentMethodId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
});

export const SubscriptionCreateSchema = z.object({
  priceId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  planName: z.string().optional(),
  amount: z.number().positive(),
  interval: z.enum(["day", "week", "month", "year"]).optional(),
});

export const SubscriptionCancelSchema = z.object({
  immediately: z.boolean().optional(),
});

export const AdminRefundSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().positive().optional(),
});

// User registration validation
export const userRegistrationSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number",
    ),
  firstName: z.string().min(1, "First name required").max(100).trim(),
  lastName: z.string().min(1, "Last name required").max(100).trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .trim()
    .optional(),
});

// User login validation
export const userLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password required"),
});

// User login validation (alias for compatibility)
export const loginSchema = userLoginSchema;

// Password change validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number",
    ),
});

// Transaction validation
export const transactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large"),
  description: z.string().max(500, "Description too long").optional(),
  type: z.enum(["credit", "debit"]),
});

// Payment validation
export const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(50000, "Amount too large"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("USD"),
  description: z.string().max(500, "Description too long").optional(),
  paymentMethodId: z.string().min(1, "Payment method required"),
});

// Crypto order validation
export const cryptoOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z
    .string()
    .min(1, "Currency is required")
    .max(10, "Currency too long"),
  orderId: z.string().optional(),
  description: z.string().max(500, "Description too long").optional(),
});

// Admin user creation validation
export const adminUserCreateSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z
    .string()
    .min(12, "Admin password must be at least 12 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number, and special character",
    ),
  firstName: z.string().min(1, "First name required").max(100).trim(),
  lastName: z.string().min(1, "Last name required").max(100).trim(),
  role: z.enum(["admin", "super_admin"]),
});

// Project/Task/Team schemas (DTO-style)
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  assigneeId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  assigneeId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  members: z.array(z.string().uuid()).default([]),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  members: z.array(z.string().uuid()).optional(),
});

// Pagination query params
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((v) => Math.max(1, parseInt(v, 10) || 1)),
  pageSize: z
    .string()
    .optional()
    .default("10")
    .transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 10))),
});

// Contact/Support validation
export const contactSchema = z.object({
  name: z.string().min(1, "Name required").max(100).trim(),
  email: z.string().email("Invalid email format").max(255),
  subject: z.string().min(5, "Subject too short").max(200).trim(),
  message: z.string().min(10, "Message too short").max(2000).trim(),
});

// File upload validation
export const fileUploadSchema = z.object({
  fileName: z.string().max(255),
  fileSize: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"), // 10MB limit
  mimeType: z
    .string()
    .refine(
      (type) =>
        ["image/jpeg", "image/png", "image/gif", "application/pdf"].includes(
          type,
        ),
      "Invalid file type",
    ),
});

// IP block validation
export const ipBlockSchema = z.object({
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IP address format"),
  reason: z.string().min(5, "Reason required").max(500).trim(),
  blockedBy: z.string().min(1, "Blocker ID required"),
});

// Settings validation
export const settingsSchema = z.object({
  key: z.string().min(1, "Key required").max(100).trim(),
  value: z.string().max(1000).trim(),
  type: z.enum(["string", "number", "boolean", "json"]),
});

// Generic ID validation
export const idSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1, "Page must be at least 1").default(1),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit too large")
    .default(10),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, "Search query required").max(100).trim(),
  filters: z.record(z.string(), z.any()).optional(),
});

// Export validation schemas
export const validationSchemas = {
  userRegistration: userRegistrationSchema,
  userLogin: userLoginSchema,
  passwordChange: passwordChangeSchema,
  transaction: transactionSchema,
  payment: paymentSchema,
  cryptoOrder: cryptoOrderSchema,
  adminUserCreate: adminUserCreateSchema,
  contact: contactSchema,
  fileUpload: fileUploadSchema,
  ipBlock: ipBlockSchema,
  settings: settingsSchema,
  id: idSchema,
  pagination: paginationSchema,
  search: searchSchema,
};
