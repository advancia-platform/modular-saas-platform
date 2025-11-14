import { z } from "zod";

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
  type: z.enum(["credit", "debit"], {
    errorMap: () => ({ message: "Invalid transaction type" }),
  }),
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
  role: z.enum(["admin", "super_admin"], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
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
  type: z.enum(["string", "number", "boolean", "json"], {
    errorMap: () => ({ message: "Invalid setting type" }),
  }),
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
  filters: z.record(z.any()).optional(),
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
