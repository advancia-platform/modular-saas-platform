import { z } from "zod";

/**
 * Parse and validate arbitrary input against a Zod schema.
 * Returns the typed result or throws a ZodError for the caller to handle.
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
