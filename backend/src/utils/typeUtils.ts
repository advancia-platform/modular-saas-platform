/**
 * Common TypeScript Type Utilities
 * Fixes for common TS bugs: type mismatches, null/undefined, async issues
 */

// ============================================
// SAFE TYPE ASSERTIONS (avoid 'as any')
// ============================================

/**
 * Safely cast unknown to a specific type with runtime validation
 */
export function safeCast<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  fallback: T,
): T {
  return validator(value) ? value : fallback;
}

/**
 * Assert value is not null/undefined, throw if it is
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined',
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Non-null assertion with custom error
 */
export function nonNull<T>(value: T | null | undefined, name = 'value'): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${name} to be defined, got ${value}`);
  }
  return value;
}

/**
 * Optional chaining helper that returns undefined instead of throwing
 */
export function maybe<T, R>(
  value: T | null | undefined,
  fn: (v: T) => R,
): R | undefined {
  return value != null ? fn(value) : undefined;
}

// ============================================
// TYPE GUARDS (runtime type checking)
// ============================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if value has a specific property
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K,
): obj is { [P in K]: unknown } {
  return isObject(obj) && key in obj;
}

/**
 * Check if object has all required properties
 */
export function hasProperties<K extends string>(
  obj: unknown,
  keys: K[],
): obj is { [P in K]: unknown } {
  return isObject(obj) && keys.every((key) => key in obj);
}

// ============================================
// ASYNC/PROMISE UTILITIES
// ============================================

/**
 * Properly typed Promise.all with tuple inference
 */
export async function promiseAll<T extends readonly unknown[]>(promises: {
  [K in keyof T]: Promise<T[K]> | T[K];
}): Promise<T> {
  return Promise.all(promises) as Promise<T>;
}

/**
 * Safe async wrapper that catches errors
 */
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<[T, null] | [null, E]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, error as E];
  }
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; backoff?: number } = {},
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(backoff, attempt)),
        );
      }
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}

/**
 * Debounced async function
 */
export function debounceAsync<
  T extends (...args: Parameters<T>) => Promise<ReturnType<T>>,
>(fn: T, delay: number): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          pendingPromise = fn(...args);
          const result = await pendingPromise;
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          pendingPromise = null;
        }
      }, delay);
    });
  };
}

// ============================================
// NULL/UNDEFINED SAFE UTILITIES
// ============================================

/**
 * Coalesce multiple values, returning first non-null
 */
export function coalesce<T>(
  ...values: (T | null | undefined)[]
): T | undefined {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return undefined;
}

/**
 * Default value helper
 */
export function withDefault<T>(
  value: T | null | undefined,
  defaultValue: T,
): T {
  return value ?? defaultValue;
}

/**
 * Safe property access with default
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K],
): T[K] {
  return obj?.[key] ?? defaultValue;
}

/**
 * Safe deep property access
 */
export function getPath<T>(
  obj: unknown,
  path: string,
  defaultValue?: T,
): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    if (typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current as T) ?? defaultValue;
}

// ============================================
// TYPE CONVERSION UTILITIES
// ============================================

/**
 * Parse string to number safely
 */
export function toNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Parse to integer safely
 */
export function toInt(value: unknown, defaultValue = 0): number {
  const num = toNumber(value, defaultValue);
  return Math.floor(num);
}

/**
 * Parse to boolean safely
 */
export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

/**
 * Ensure value is an array
 */
export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Parse JSON safely
 */
export function parseJSON<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete (result as Record<string, unknown>)[key as string];
  }
  return result as Omit<T, K>;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Remove null/undefined values from object
 */
export function compact<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

// ============================================
// RESULT TYPE (for error handling without exceptions)
// ============================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { success: false; error: E } {
  return !result.success;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  // TypeScript narrowing: if not success, result must be the error variant
  const errorResult = result as { success: false; error: E };
  throw errorResult.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

// ============================================
// VALIDATION HELPERS
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export type Validator<T> = (value: unknown) => Result<T, ValidationError[]>;

export function createValidator<T>(
  validate: (value: unknown) => T | null,
  errorMessage: string,
  fieldName: string,
): Validator<T> {
  return (value: unknown): Result<T, ValidationError[]> => {
    const result = validate(value);
    if (result !== null) {
      return ok(result);
    }
    return err([{ field: fieldName, message: errorMessage, value }]);
  };
}

export function validateEmail(
  email: unknown,
): Result<string, ValidationError[]> {
  if (!isString(email)) {
    return err([
      { field: 'email', message: 'Email must be a string', value: email },
    ]);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return err([
      { field: 'email', message: 'Invalid email format', value: email },
    ]);
  }
  return ok(email);
}

export function validateRequired(
  value: unknown,
  fieldName: string,
): Result<unknown, ValidationError[]> {
  if (value === null || value === undefined || value === '') {
    return err([
      { field: fieldName, message: `${fieldName} is required`, value },
    ]);
  }
  return ok(value);
}

export function validateMinLength(
  value: unknown,
  minLength: number,
  fieldName: string,
): Result<string, ValidationError[]> {
  if (!isString(value)) {
    return err([
      { field: fieldName, message: `${fieldName} must be a string`, value },
    ]);
  }
  if (value.length < minLength) {
    return err([
      {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters`,
        value,
      },
    ]);
  }
  return ok(value);
}

export function validateRange(
  value: unknown,
  min: number,
  max: number,
  fieldName: string,
): Result<number, ValidationError[]> {
  const num = toNumber(value, NaN);
  if (Number.isNaN(num)) {
    return err([
      { field: fieldName, message: `${fieldName} must be a number`, value },
    ]);
  }
  if (num < min || num > max) {
    return err([
      {
        field: fieldName,
        message: `${fieldName} must be between ${min} and ${max}`,
        value,
      },
    ]);
  }
  return ok(num);
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Assertions
  safeCast,
  assertDefined,
  nonNull,
  maybe,
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isDate,
  isError,
  hasProperty,
  hasProperties,
  // Async
  promiseAll,
  tryCatch,
  retry,
  withTimeout,
  debounceAsync,
  // Null safety
  coalesce,
  withDefault,
  safeGet,
  getPath,
  // Conversions
  toNumber,
  toInt,
  toBoolean,
  toArray,
  parseJSON,
  // Objects
  pick,
  omit,
  deepClone,
  compact,
  // Result type
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  // Validation
  createValidator,
  validateEmail,
  validateRequired,
  validateMinLength,
  validateRange,
};
