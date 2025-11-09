import { Decimal } from "@prisma/client/runtime/library";

/**
 * Type guard to check if a value is a Prisma Decimal instance.
 */
function isDecimal(value: any): value is Decimal {
  return (
    value &&
    typeof value === "object" &&
    value.constructor &&
    value.constructor.name === "Decimal"
  );
}

/**
 * Converts a Prisma Decimal field to a string for JSON serialization.
 * This ensures consistent handling of decimal values across all API responses.
 *
 * @param value - The Decimal value from Prisma
 * @returns String representation of the decimal value
 *
 * @example
 * const balance = await prisma.tokenWallet.findUnique({ where: { id } });
 * res.json({ balance: serializeDecimal(balance.balance) });
 */
export function serializeDecimal(value: Decimal | null | undefined): string {
  if (value === null || value === undefined) {
    return "0";
  }
  return value.toString();
}

/**
 * Serializes an object containing Decimal fields to JSON-safe format.
 * Recursively converts all Decimal values to strings.
 *
 * @param obj - Object containing Decimal fields
 * @returns Object with Decimal fields converted to strings
 *
 * @example
 * const wallet = await prisma.tokenWallet.findUnique({ where: { id } });
 * res.json(serializeDecimalFields(wallet));
 */
export function serializeDecimalFields<T extends Record<string, any>>(
  obj: T
): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const serialized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (isDecimal(value)) {
      serialized[key] = value.toString();
    } else if (value && typeof value === "object") {
      serialized[key] = serializeDecimalFields(value);
    } else {
      serialized[key] = value;
    }
  }

  return serialized as T;
}

/**
 * Serializes an array of objects containing Decimal fields.
 * Useful for serializing lists of transactions, wallets, etc.
 *
 * @param array - Array of objects containing Decimal fields
 * @returns Array with Decimal fields converted to strings
 *
 * @example
 * const transactions = await prisma.transaction.findMany();
 * res.json(serializeDecimalArray(transactions));
 */
export function serializeDecimalArray<T extends Record<string, any>>(
  array: T[]
): T[] {
  return array.map((item) => serializeDecimalFields(item));
}

/**
 * Parses a string or number to Prisma Decimal.
 * Useful for converting API input to Decimal for database operations.
 *
 * @param value - String or number to convert
 * @returns Prisma Decimal instance
 *
 * @example
 * const amount = parseToDecimal(req.body.amount);
 * await prisma.transaction.create({ data: { amount } });
 */
export function parseToDecimal(value: string | number): Decimal {
  return new Decimal(value);
}

/**
 * Safely adds two Decimal values.
 *
 * @param a - First Decimal value
 * @param b - Second Decimal value
 * @returns Sum as Decimal
 *
 * @example
 * const newBalance = addDecimals(currentBalance, transactionAmount);
 */
export function addDecimals(a: Decimal, b: Decimal): Decimal {
  return a.plus(b);
}

/**
 * Safely subtracts two Decimal values.
 *
 * @param a - First Decimal value (minuend)
 * @param b - Second Decimal value (subtrahend)
 * @returns Difference as Decimal
 *
 * @example
 * const newBalance = subtractDecimals(currentBalance, withdrawalAmount);
 */
export function subtractDecimals(a: Decimal, b: Decimal): Decimal {
  return a.minus(b);
}

/**
 * Compares two Decimal values.
 *
 * @param a - First Decimal value
 * @param b - Second Decimal value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 *
 * @example
 * if (compareDecimals(balance, withdrawalAmount) < 0) {
 *   throw new Error(''Insufficient balance'');
 * }
 */
export function compareDecimals(a: Decimal, b: Decimal): number {
  return a.comparedTo(b);
}

/**
 * Checks if a Decimal value is greater than another.
 *
 * @param a - First Decimal value
 * @param b - Second Decimal value
 * @returns true if a > b
 */
export function isGreaterThan(a: Decimal, b: Decimal): boolean {
  return a.greaterThan(b);
}

/**
 * Checks if a Decimal value is less than another.
 *
 * @param a - First Decimal value
 * @param b - Second Decimal value
 * @returns true if a < b
 */
export function isLessThan(a: Decimal, b: Decimal): boolean {
  return a.lessThan(b);
}

/**
 * Checks if a Decimal value is zero.
 *
 * @param value - Decimal value to check
 * @returns true if value is zero
 */
export function isZero(value: Decimal): boolean {
  return value.isZero();
}
