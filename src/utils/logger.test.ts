import {
  Logger,
  LogLevel,
  parseLogFormat,
  parseLogLevel,
} from './logger.js';
import { runWithRequestContext } from './request-context.js';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('filters messages using the configured level', () => {
    const logger = new Logger(LogLevel.WARN);

    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls[0]?.[0]).toContain('WARN');
    expect(consoleSpy.mock.calls[1]?.[0]).toContain('ERROR');
  });

  it('supports changing level and format at runtime', () => {
    const logger = new Logger(LogLevel.NONE);

    logger.info('hidden');
    logger.setLevel(LogLevel.INFO);
    logger.setFormat('json');
    logger.info('visible');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(consoleSpy.mock.calls[0]?.[0] as string)).toMatchObject({
      level: 'info',
      message: 'visible',
    });
  });

  it('emits structured JSON with request context and errors', () => {
    const logger = new Logger(LogLevel.INFO, 'json');

    runWithRequestContext(
      { correlationId: 'request-123', sessionId: 'session-456' },
      () => logger.error('API failed', new Error('timeout'))
    );

    const output = JSON.parse(consoleSpy.mock.calls[0]?.[0] as string);
    expect(output).toMatchObject({
      level: 'error',
      message: 'API failed',
      correlationId: 'request-123',
      sessionId: 'session-456',
      details: [{ name: 'Error', message: 'timeout' }],
    });
    expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('always writes logs to stderr', () => {
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const logger = new Logger(LogLevel.DEBUG);

    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.success('success');

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledTimes(5);
    stdoutSpy.mockRestore();
  });
});

describe('logger configuration', () => {
  it('validates log levels', () => {
    expect(parseLogLevel(undefined)).toBe(LogLevel.INFO);
    expect(parseLogLevel('0')).toBe(LogLevel.DEBUG);
    expect(parseLogLevel('4')).toBe(LogLevel.NONE);
    expect(() => parseLogLevel('invalid')).toThrow('LOG_LEVEL must be an integer between 0 and 4');
    expect(() => parseLogLevel('5')).toThrow('LOG_LEVEL must be an integer between 0 and 4');
  });

  it('validates log formats', () => {
    expect(parseLogFormat(undefined)).toBe('text');
    expect(parseLogFormat('JSON')).toBe('json');
    expect(() => parseLogFormat('xml')).toThrow('LOG_FORMAT must be either "text" or "json"');
  });
});
