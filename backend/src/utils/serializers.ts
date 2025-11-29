/**
 * Serialization Utilities
 * Converts Prisma types (Decimal, Date) to JSON-safe formats
 */

// Safe Prisma import - may not be available if client not generated
let Prisma: any;
try {
  Prisma = require("@prisma/client").Prisma;
} catch {
  Prisma = { Decimal: class {} };
}
type Decimal = typeof Prisma.Decimal;

/**
 * Check if value is a Decimal-like object (has toNumber method)
 */
function isDecimalLike(value: unknown): value is { toNumber(): number } {
  return (
    value !== null &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as any).toNumber === "function"
  );
}

/**
 * Convert Decimal to number
 */
export function serializeDecimal(value: any): number {
  if (isDecimalLike(value)) {
    return value.toNumber();
  }
  if (typeof value === "string") {
    return parseFloat(value);
  }
  return Number(value) || 0;
}

/**
 * Convert Date to ISO string
 */
export function serializeDate(value: any): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Recursively serialize Prisma objects
 * Handles Decimal → number, Date → ISO string
 */
export function serializePrismaObject(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => serializePrismaObject(item));
  }

  const serialized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isDecimalLike(value)) {
      serialized[key] = value.toNumber();
    } else if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      serialized[key] = serializePrismaObject(value);
    } else if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        typeof item === "object" ? serializePrismaObject(item) : item,
      );
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

/**
 * Parse amount from string or number, return null if invalid
 */
export function parseAmount(value: any): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}
