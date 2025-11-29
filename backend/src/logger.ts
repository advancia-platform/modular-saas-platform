/**
 * Simplified Logger Export
 * Re-exports winston logger with simplified configuration
 * Supports both Winston style (message, meta) and Pino style (meta, message)
 */
import { createLogger, format, transports } from 'winston';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

const winstonLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'advancia-backend' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          // Filter out service from display
          const displayMeta = { ...metadata };
          delete displayMeta.service;
          if (Object.keys(displayMeta).length > 0) {
            msg += ` ${JSON.stringify(displayMeta)}`;
          }
          return msg;
        }),
      ),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Flexible logger that supports both:
 * - Winston style: logger.info('message', { meta })
 * - Pino style: logger.info({ meta }, 'message')
 */
interface FlexibleLogMethod {
  (message: string, meta?: Record<string, unknown>): void;
  (meta: Record<string, unknown>, message: string): void;
}

interface FlexibleLogger {
  info: FlexibleLogMethod;
  error: FlexibleLogMethod;
  warn: FlexibleLogMethod;
  debug: FlexibleLogMethod;
  child: (meta: Record<string, unknown>) => FlexibleLogger;
}

function createFlexibleLogMethod(
  level: 'info' | 'error' | 'warn' | 'debug',
): FlexibleLogMethod {
  return (
    arg1: string | Record<string, unknown>,
    arg2?: string | Record<string, unknown>,
  ) => {
    let message: string;
    let meta: Record<string, unknown> = {};

    // Detect Pino-style: (object, string)
    if (typeof arg1 === 'object' && typeof arg2 === 'string') {
      meta = arg1;
      message = arg2;
    }
    // Winston-style: (string, object?)
    else if (typeof arg1 === 'string') {
      message = arg1;
      if (typeof arg2 === 'object') {
        meta = arg2;
      }
    }
    // Just object, no message
    else if (typeof arg1 === 'object') {
      message = JSON.stringify(arg1);
    }
    // Fallback
    else {
      message = String(arg1);
    }

    winstonLogger[level](message, meta);
  };
}

export const logger: FlexibleLogger = {
  info: createFlexibleLogMethod('info'),
  error: createFlexibleLogMethod('error'),
  warn: createFlexibleLogMethod('warn'),
  debug: createFlexibleLogMethod('debug'),
  child: (defaultMeta: Record<string, unknown>) => {
    const _childWinston = winstonLogger.child(defaultMeta);
    return {
      info: (
        arg1: string | Record<string, unknown>,
        arg2?: string | Record<string, unknown>,
      ) => {
        const method = createFlexibleLogMethod('info');
        method(arg1 as any, arg2 as any);
      },
      error: (
        arg1: string | Record<string, unknown>,
        arg2?: string | Record<string, unknown>,
      ) => {
        const method = createFlexibleLogMethod('error');
        method(arg1 as any, arg2 as any);
      },
      warn: (
        arg1: string | Record<string, unknown>,
        arg2?: string | Record<string, unknown>,
      ) => {
        const method = createFlexibleLogMethod('warn');
        method(arg1 as any, arg2 as any);
      },
      debug: (
        arg1: string | Record<string, unknown>,
        arg2?: string | Record<string, unknown>,
      ) => {
        const method = createFlexibleLogMethod('debug');
        method(arg1 as any, arg2 as any);
      },
      child: (meta: Record<string, unknown>) =>
        logger.child({ ...defaultMeta, ...meta }),
    };
  },
};

// Re-export for convenience
export default logger;
