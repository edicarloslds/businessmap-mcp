/**
 * Logger utility for MCP servers
 *
 * MCP servers MUST use STDERR for all logging to avoid corrupting
 * the JSON-RPC protocol which uses STDOUT exclusively.
 *
 * This logger provides different log levels while ensuring all output
 * goes to STDERR (process.stderr.write or console.error).
 */
import { getRequestContext } from './request-context.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export type LogFormat = 'text' | 'json';

const LEVEL_NAMES = {
  debug: '🔍 DEBUG',
  info: 'ℹ️  INFO',
  warn: '⚠️  WARN',
  error: '❌ ERROR',
  success: '✅ SUCCESS',
} as const;

export function parseLogLevel(value: string | undefined): LogLevel {
  if (value === undefined || value === '') {
    return LogLevel.INFO;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < LogLevel.DEBUG || parsed > LogLevel.NONE) {
    throw new TypeError('LOG_LEVEL must be an integer between 0 and 4');
  }
  return parsed;
}

export function parseLogFormat(value: string | undefined): LogFormat {
  const format = (value || 'text').toLowerCase();
  if (format === 'text' || format === 'json') {
    return format;
  }
  throw new TypeError('LOG_FORMAT must be either "text" or "json"');
}

function stringifyJson(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item: unknown) => {
    if (item instanceof Error) {
      return { name: item.name, message: item.message, stack: item.stack };
    }
    if (typeof item === 'bigint') {
      return item.toString();
    }
    if (item !== null && typeof item === 'object') {
      if (seen.has(item)) {
        return '[Circular]';
      }
      seen.add(item);
    }
    return item;
  });
}

export class Logger {
  private currentLevel: LogLevel;
  private format: LogFormat;

  constructor(level: LogLevel = LogLevel.INFO, format: LogFormat = 'text') {
    this.currentLevel = level;
    this.format = format;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  setFormat(format: LogFormat): void {
    this.format = format;
  }

  /**
   * Debug messages for development and troubleshooting
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      this.log('debug', message, ...args);
    }
  }

  /**
   * Informational messages (successful operations, status updates)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.log('info', message, ...args);
    }
  }

  /**
   * Warning messages (non-critical issues, fallbacks)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      this.log('warn', message, ...args);
    }
  }

  /**
   * Error messages (failures, exceptions)
   */
  error(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      this.log('error', message, ...args);
    }
  }

  /**
   * Success messages (operations completed successfully)
   */
  success(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.log('success', message, ...args);
    }
  }

  private log(level: keyof typeof LEVEL_NAMES, message: string, ...args: unknown[]): void {
    // CRITICAL: Always use STDERR for MCP servers
    // STDOUT is reserved for JSON-RPC protocol only
    const timestamp = new Date().toISOString();
    const context = getRequestContext();

    if (this.format === 'json') {
      console.error(
        stringifyJson({
          timestamp,
          level,
          message,
          ...(context && {
            correlationId: context.correlationId,
            ...(context.sessionId && { sessionId: context.sessionId }),
          }),
          ...(args.length > 0 && { details: args }),
        })
      );
      return;
    }

    const contextSuffix = context ? ` [request: ${context.correlationId}]` : '';
    const formattedMessage = `[${timestamp}] ${LEVEL_NAMES[level]}: ${message}${contextSuffix}`;
    if (args.length > 0) {
      console.error(formattedMessage, ...args);
    } else {
      console.error(formattedMessage);
    }
  }
}

// Export singleton instance
export const logger = new Logger(
  parseLogLevel(process.env.LOG_LEVEL),
  parseLogFormat(process.env.LOG_FORMAT)
);
