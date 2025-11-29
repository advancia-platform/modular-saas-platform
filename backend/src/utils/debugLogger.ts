/**
 * TypeScript Debug Logger Utility
 * Provides structured console.log debugging with type safety
 * Enable/disable via DEBUG_MODE environment variable
 */

// Debug configuration
const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development';
const DEBUG_LEVEL = process.env.DEBUG_LEVEL || 'info'; // 'debug' | 'info' | 'warn' | 'error'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Type definitions for better TypeScript support
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogData = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

interface DebugOptions {
  showTimestamp?: boolean;
  showFile?: boolean;
  showLine?: boolean;
  colorize?: boolean;
}

const defaultOptions: DebugOptions = {
  showTimestamp: true,
  showFile: true,
  showLine: true,
  colorize: true,
};

// Get caller info (file and line number)
function getCallerInfo(): { file: string; line: string } {
  const stack = new Error().stack;
  if (!stack) return { file: 'unknown', line: '?' };

  const lines = stack.split('\n');
  // Skip Error, getCallerInfo, and the debug function itself
  const callerLine = lines[4] || lines[3] || '';

  const match = callerLine.match(/at\s+(?:.*?\s+)?(?:\()?(.+?):(\d+):\d+\)?/);
  if (match) {
    const fullPath = match[1];
    const file = fullPath.split(/[/\\]/).pop() || fullPath;
    return { file, line: match[2] };
  }

  return { file: 'unknown', line: '?' };
}

// Format timestamp
function getTimestamp(): string {
  return new Date().toISOString();
}

// Safely stringify any value with type info
function safeStringify(value: unknown, indent = 2): string {
  const seen = new WeakSet();

  return JSON.stringify(value, (key, val) => {
    // Handle circular references
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return '[Circular Reference]';
      }
      seen.add(val);
    }

    // Handle special types
    if (val instanceof Error) {
      return {
        __type: 'Error',
        name: val.name,
        message: val.message,
        stack: val.stack?.split('\n').slice(0, 5),
      };
    }

    if (typeof val === 'function') {
      return `[Function: ${val.name || 'anonymous'}]`;
    }

    if (typeof val === 'bigint') {
      return `${val.toString()}n`;
    }

    if (val instanceof Date) {
      return { __type: 'Date', value: val.toISOString() };
    }

    if (val instanceof Map) {
      return { __type: 'Map', entries: Array.from(val.entries()) };
    }

    if (val instanceof Set) {
      return { __type: 'Set', values: Array.from(val.values()) };
    }

    return val;
  }, indent);
}

// Get type information for a value
function getTypeInfo(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `Array[${value.length}]`;
  if (value instanceof Date) return 'Date';
  if (value instanceof Error) return `Error(${value.name})`;
  if (value instanceof Map) return `Map[${value.size}]`;
  if (value instanceof Set) return `Set[${value.size}]`;
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    const name = proto?.constructor?.name || 'Object';
    return `${name}{${Object.keys(value as object).length}}`;
  }
  return typeof value;
}

/**
 * Main Debug Logger Class
 */
class DebugLogger {
  private options: DebugOptions;
  private namespace: string;

  constructor(namespace = 'app', options: Partial<DebugOptions> = {}) {
    this.namespace = namespace;
    this.options = { ...defaultOptions, ...options };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!DEBUG_MODE) return level === 'error'; // Always log errors

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(DEBUG_LEVEL as LogLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const parts: string[] = [];
    const { file, line } = getCallerInfo();

    // Timestamp
    if (this.options.showTimestamp) {
      parts.push(`[${getTimestamp()}]`);
    }

    // Level with color
    const levelColors: Record<LogLevel, string> = {
      debug: colors.dim + colors.white,
      info: colors.blue,
      warn: colors.yellow,
      error: colors.red,
    };

    if (this.options.colorize) {
      parts.push(`${levelColors[level]}[${level.toUpperCase()}]${colors.reset}`);
    } else {
      parts.push(`[${level.toUpperCase()}]`);
    }

    // Namespace
    if (this.options.colorize) {
      parts.push(`${colors.magenta}[${this.namespace}]${colors.reset}`);
    } else {
      parts.push(`[${this.namespace}]`);
    }

    // File and line
    if (this.options.showFile) {
      if (this.options.colorize) {
        parts.push(`${colors.cyan}${file}:${line}${colors.reset}`);
      } else {
        parts.push(`${file}:${line}`);
      }
    }

    // Message
    parts.push(message);

    // Data with type info
    if (data !== undefined) {
      const typeInfo = getTypeInfo(data);
      parts.push(`${colors.dim}(${typeInfo})${colors.reset}`);

      if (typeof data === 'object' && data !== null) {
        parts.push('\n' + safeStringify(data));
      } else {
        parts.push(String(data));
      }
    }

    return parts.join(' ');
  }

  // Log methods
  debug(message: string, data?: LogData): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: LogData): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: LogData): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: LogData): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  // Special debugging methods

  /**
   * Log a value with its type information
   */
  type<T>(label: string, value: T): T {
    if (DEBUG_MODE) {
      console.log(
        `${colors.green}[TYPE]${colors.reset} ${label}: ` +
        `${colors.yellow}${getTypeInfo(value)}${colors.reset} = `,
        value
      );
    }
    return value; // Return value for chaining
  }

  /**
   * Assert a condition and log if it fails
   */
  assert(condition: boolean, message: string, data?: LogData): void {
    if (!condition) {
      this.error(`ASSERTION FAILED: ${message}`, data);
      if (DEBUG_MODE) {
        console.trace('Assertion stack trace');
      }
    }
  }

  /**
   * Log function entry with arguments
   */
  enter(fnName: string, args?: Record<string, unknown>): void {
    if (DEBUG_MODE) {
      console.log(
        `${colors.green}→ ENTER${colors.reset} ${colors.bright}${fnName}${colors.reset}`,
        args ? safeStringify(args) : ''
      );
    }
  }

  /**
   * Log function exit with return value
   */
  exit<T>(fnName: string, returnValue?: T): T | undefined {
    if (DEBUG_MODE) {
      console.log(
        `${colors.red}← EXIT${colors.reset} ${colors.bright}${fnName}${colors.reset}`,
        returnValue !== undefined ? `= ${safeStringify(returnValue)}` : ''
      );
    }
    return returnValue;
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`⏱️ ${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`⏱️ ${label} failed after ${duration.toFixed(2)}ms`, error as LogData);
      throw error;
    }
  }

  /**
   * Create a child logger with a sub-namespace
   */
  child(subNamespace: string): DebugLogger {
    return new DebugLogger(`${this.namespace}:${subNamespace}`, this.options);
  }

  /**
   * Log a table of data
   */
  table(label: string, data: Record<string, unknown>[] | unknown[][]): void {
    if (DEBUG_MODE) {
      console.log(`${colors.blue}[TABLE]${colors.reset} ${label}:`);
      console.table(data);
    }
  }

  /**
   * Group related logs
   */
  group(label: string, fn: () => void): void {
    if (DEBUG_MODE) {
      console.group(`${colors.magenta}${label}${colors.reset}`);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    } else {
      fn();
    }
  }
}

// Export singleton instance and factory
export const debug = new DebugLogger('app');

export function createLogger(namespace: string, options?: Partial<DebugOptions>): DebugLogger {
  return new DebugLogger(namespace, options);
}

// Quick console.log replacements with type info
export const log = {
  /** Quick debug log with type info */
  d: <T>(label: string, value: T): T => {
    if (DEBUG_MODE) {
      console.log(`🔍 ${label}:`, `(${getTypeInfo(value)})`, value);
    }
    return value;
  },

  /** Log error with stack */
  e: (message: string, error?: unknown): void => {
    console.error(`❌ ${message}:`, error);
    if (error instanceof Error && DEBUG_MODE) {
      console.error(error.stack);
    }
  },

  /** Log warning */
  w: (message: string, data?: unknown): void => {
    console.warn(`⚠️ ${message}:`, data);
  },

  /** Log success */
  s: (message: string, data?: unknown): void => {
    console.log(`✅ ${message}:`, data);
  },

  /** Log info */
  i: (message: string, data?: unknown): void => {
    console.log(`ℹ️ ${message}:`, data);
  },

  /** Log object with JSON formatting */
  json: (label: string, obj: unknown): void => {
    console.log(`📦 ${label}:\n${safeStringify(obj)}`);
  },

  /** Log async promise result */
  async: async <T>(label: string, promise: Promise<T>): Promise<T> => {
    try {
      const result = await promise;
      console.log(`✅ ${label} resolved:`, `(${getTypeInfo(result)})`, result);
      return result;
    } catch (error) {
      console.error(`❌ ${label} rejected:`, error);
      throw error;
    }
  },
};

// Type guard helpers with logging
export const guards = {
  isString: (value: unknown, label = 'value'): value is string => {
    const result = typeof value === 'string';
    if (!result && DEBUG_MODE) {
      console.warn(`Type guard failed: ${label} expected string, got ${getTypeInfo(value)}`);
    }
    return result;
  },

  isNumber: (value: unknown, label = 'value'): value is number => {
    const result = typeof value === 'number' && !isNaN(value);
    if (!result && DEBUG_MODE) {
      console.warn(`Type guard failed: ${label} expected number, got ${getTypeInfo(value)}`);
    }
    return result;
  },

  isObject: (value: unknown, label = 'value'): value is Record<string, unknown> => {
    const result = typeof value === 'object' && value !== null && !Array.isArray(value);
    if (!result && DEBUG_MODE) {
      console.warn(`Type guard failed: ${label} expected object, got ${getTypeInfo(value)}`);
    }
    return result;
  },

  isArray: (value: unknown, label = 'value'): value is unknown[] => {
    const result = Array.isArray(value);
    if (!result && DEBUG_MODE) {
      console.warn(`Type guard failed: ${label} expected array, got ${getTypeInfo(value)}`);
    }
    return result;
  },

  isDefined: <T>(value: T | undefined | null, label = 'value'): value is T => {
    const result = value !== undefined && value !== null;
    if (!result && DEBUG_MODE) {
      console.warn(`Type guard failed: ${label} is ${value === null ? 'null' : 'undefined'}`);
    }
    return result;
  },

  hasProperty: <K extends string>(
    obj: unknown,
    prop: K,
    label = 'object'
  ): obj is Record<K, unknown> => {
    const result = typeof obj === 'object' && obj !== null && prop in obj;
    if (!result && DEBUG_MODE) {
      console.warn(`Type guard failed: ${label} missing property '${prop}'`);
    }
    return result;
  },
};

export default debug;
