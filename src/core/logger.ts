/**
 * @file Structured Logger - Production-grade logging
 * @rule Per PRODUCTION HARDENING PLAN - P0: Observability
 */

import pino from 'pino';

/**
 * Log levels
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level?: LogLevel;
  pretty?: boolean;
  name?: string;
}

/**
 * Create production logger
 * @rule Structured logging for observability
 * @rule Use JSON logging by default for production compatibility
 */
export function createLogger(config: LoggerConfig = {}): pino.Logger {
  const isDev = process.env.NODE_ENV !== 'production';
  const level = config.level || process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

  return pino({
    level,
    name: config.name || 'cerber-core',

    // Base metadata
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      env: process.env.NODE_ENV || 'development',
    },

    // Production: structured JSON (default)
    // Note: pino-pretty is optional for development pretty-printing
    // Use: cat <logfile> | npx pino-pretty
    formatters: {
      level: (label) => ({ level: label }),
    },

    // Timestamp
    timestamp: pino.stdTimeFunctions.isoTime,

    // Redact sensitive data
    redact: {
      paths: ['*.password', '*.token', '*.secret', '*.apiKey'],
      remove: true,
    },
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create child logger with context
 * @example
 * const log = logger.child({ operation: 'orchestrator.run', runId: uuid() });
 * log.info('Starting orchestration', { tools: ['actionlint'] });
 */
export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}

/**
 * Log timing information
 * @example
 * const timer = startTimer();
 * // ... do work ...
 * timer.end('Operation complete');
 */
export function startTimer() {
  const start = Date.now();

  return {
    end: (message: string, context?: Record<string, unknown>) => {
      const duration = Date.now() - start;
      logger.info({ ...context, duration }, message);
      return duration;
    },
  };
}

/**
 * Log error with full context
 * @rule Preserve stack traces and error context
 */
export function logError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorContext = {
    ...context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      errno: (error as any).errno,
      syscall: (error as any).syscall,
    } : String(error),
  };

  logger.error(errorContext, message);
}

/**
 * Request ID generator (for tracing)
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
