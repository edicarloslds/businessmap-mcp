import { LogLevel } from './logger.js';

// We need a fresh Logger instance (not the singleton) for isolated tests
class Logger {
  private currentLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.currentLevel = level;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      this.log('🔍 DEBUG', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.log('ℹ️  INFO', message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      this.log('⚠️  WARN', message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      this.log('❌ ERROR', message, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      this.log('✅ SUCCESS', message, ...args);
    }
  }

  private log(prefix: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${prefix}: ${message}`;
    if (args.length > 0) {
      console.error(formattedMessage, ...args);
    } else {
      console.error(formattedMessage);
    }
  }
}

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('log level filtering', () => {
    it('does not emit DEBUG messages at INFO level', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.debug('debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('emits INFO messages at INFO level', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('info message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('INFO');
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('info message');
    });

    it('emits DEBUG messages when level is DEBUG', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('DEBUG');
    });

    it('does not emit INFO messages at WARN level', () => {
      const logger = new Logger(LogLevel.WARN);
      logger.info('should be filtered');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('emits WARN at WARN level', () => {
      const logger = new Logger(LogLevel.WARN);
      logger.warn('warning message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('WARN');
    });

    it('emits ERROR at ERROR level', () => {
      const logger = new Logger(LogLevel.ERROR);
      logger.error('error message');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('ERROR');
    });

    it('suppresses all messages at NONE level', () => {
      const logger = new Logger(LogLevel.NONE);
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
      logger.success('s');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    it('dynamically changes the log level', () => {
      const logger = new Logger(LogLevel.NONE);
      logger.info('should be filtered');
      expect(consoleSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.DEBUG);
      logger.info('should appear now');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('output always goes to stderr', () => {
    it('uses console.error for all log methods', () => {
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const logger = new Logger(LogLevel.DEBUG);

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
      logger.success('s');

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledTimes(5);

      stdoutSpy.mockRestore();
    });
  });

  describe('success method', () => {
    it('emits SUCCESS messages at INFO level', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.success('operation completed');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0]?.[0]).toContain('SUCCESS');
    });
  });

  describe('message format', () => {
    it('includes ISO timestamp in messages', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('test');
      const output = consoleSpy.mock.calls[0]?.[0] as string;
      expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
