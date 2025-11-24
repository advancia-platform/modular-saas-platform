import crypto from "crypto";

/**
 * Generate common required fields for Prisma create operations
 */
export const generatePrismaDefaults = () => ({
  id: crypto.randomUUID(),
  updatedAt: new Date(),
});

/**
 * Helper to merge data with required fields for models that need id and updatedAt
 */
export const withDefaults = <T extends Record<string, any>>(data: T) => ({
  ...data,
  ...generatePrismaDefaults(),
});
