import { Decimal } from "@prisma/client/runtime/library";

/**
 * Recursively converts Prisma Decimal objects to numbers in an object/array
 * This ensures JSON responses don't have Decimal objects which can't be serialized
 */
export function decimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(decimalToNumber);
  }

  if (typeof obj === "object") {
    // Check if it's a Decimal instance
    if (
      obj instanceof Decimal ||
      (obj.constructor && obj.constructor.name === "Decimal")
    ) {
      return obj.toNumber();
    }

    // Check for toNumber method (Decimal compatibility)
    if ("toNumber" in obj && typeof obj.toNumber === "function") {
      return obj.toNumber();
    }

    // Recursively process object properties
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = decimalToNumber(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
}

/**
 * Converts a single Decimal value to number, with null safety
 */
export function decimalFieldToNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (
    value instanceof Decimal ||
    (value.constructor && value.constructor.name === "Decimal")
  ) {
    return value.toNumber();
  }
  if ("toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value);
}
