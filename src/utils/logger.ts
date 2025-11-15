/**
 * Logger utility for MCP servers
 * 
 * MCP servers MUST use STDERR for all logging to avoid corrupting
 * the JSON-RPC protocol which uses STDOUT exclusively.
 * 
 * This logger provides different log levels while ensuring all output
 * goes to STDERR (process.stderr.write or console.error).
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class Logger {
  private currentLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.currentLevel = level;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Debug messages for development and troubleshooting
   */
  debug(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      this.log('🔍 DEBUG', message, ...args);
    }
  }

  /**
   * Informational messages (successful operations, status updates)
   */
  info(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.log('ℹ️  INFO', message, ...args);
    }
  }

  /**
   * Warning messages (non-critical issues, fallbacks)
   */
  warn(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      this.log('⚠️  WARN', message, ...args);
    }
  }

  /**
   * Error messages (failures, exceptions)
   */
  error(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      this.log('❌ ERROR', message, ...args);
    }
  }

  /**
   * Success messages (operations completed successfully)
   */
  success(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.log('✅ SUCCESS', message, ...args);
    }
  }

  private log(prefix: string, message: string, ...args: any[]): void {
    // CRITICAL: Always use STDERR for MCP servers
    // STDOUT is reserved for JSON-RPC protocol only
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${prefix}: ${message}`;
    
    if (args.length > 0) {
      console.error(formattedMessage, ...args);
    } else {
      console.error(formattedMessage);
    }
  }
}

// Export singleton instance
export const logger = new Logger(
  process.env.LOG_LEVEL ? Number.parseInt(process.env.LOG_LEVEL) : LogLevel.INFO
);
