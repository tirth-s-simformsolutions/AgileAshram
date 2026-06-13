import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { asyncContext as context } from '../utils';
import { LoggerService } from './logger.service';

jest.mock('../utils', () => ({
  asyncContext: {
    getTraceId: jest.fn(),
    getRequestInfo: jest.fn(),
  },
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;

  let spyLog: jest.SpyInstance;
  let spyError: jest.SpyInstance;
  let spyWarn: jest.SpyInstance;
  let spyDebug: jest.SpyInstance;
  let spyVerbose: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    spyLog = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    spyError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    spyWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    spyDebug = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    spyVerbose = jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createService = (env: string) => {
    configService = { get: jest.fn().mockReturnValue(env) } as unknown as ConfigService;
    return new LoggerService(configService);
  };

  const mockContext = (traceId: string, requestInfo: { [key: string]: unknown } = {}) => {
    (context.getTraceId as jest.Mock).mockReturnValue(traceId);
    (context.getRequestInfo as jest.Mock).mockReturnValue({
      method: 'GET',
      originalUrl: '/default',
      ip: '127.0.0.1',
      ...requestInfo,
    });
  };

  describe('log', () => {
    it('should log in pretty format when environment is local', () => {
      service = createService('local');
      mockContext('trace-1');
      service.log('test message');
      expect(spyLog).toHaveBeenCalledWith('[trace-1] test message');
    });

    it('should log in JSON format when environment is not local', () => {
      service = createService('production');
      mockContext('trace-2');
      service.log('test message');
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"message": "test message"'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-2"'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"level": "log"'));
    });
  });

  describe('warn', () => {
    it('should log warning in pretty format', () => {
      service = createService('local');
      mockContext('trace-3');
      service.warn('warning message');
      expect(spyWarn).toHaveBeenCalledWith('[trace-3] warning message');
    });

    it('should log warning in JSON format', () => {
      service = createService('production');
      mockContext('trace-4');
      service.warn('warning message');
      expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('"message": "warning message"'));
      expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-4"'));
      expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('"level": "warn"'));
    });
  });

  describe('debug', () => {
    it('should log debug message in pretty format', () => {
      service = createService('local');
      mockContext('trace-5');
      service.debug('debug message');
      expect(spyDebug).toHaveBeenCalledWith('[trace-5] debug message');
    });

    it('should log debug message in JSON format', () => {
      service = createService('production');
      mockContext('trace-6');
      service.debug('debug message');
      expect(spyDebug).toHaveBeenCalledWith(expect.stringContaining('"message": "debug message"'));
      expect(spyDebug).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-6"'));
      expect(spyDebug).toHaveBeenCalledWith(expect.stringContaining('"level": "debug"'));
    });
  });

  describe('verbose', () => {
    it('should log verbose message in pretty format', () => {
      service = createService('local');
      mockContext('trace-7');
      service.verbose('verbose message');
      expect(spyVerbose).toHaveBeenCalledWith('[trace-7] verbose message');
    });

    it('should log verbose message in JSON format', () => {
      service = createService('production');
      mockContext('trace-8');
      service.verbose('verbose message');
      expect(spyVerbose).toHaveBeenCalledWith(
        expect.stringContaining('"message": "verbose message"'),
      );
      expect(spyVerbose).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-8"'));
      expect(spyVerbose).toHaveBeenCalledWith(expect.stringContaining('"level": "verbose"'));
    });
  });

  describe('error', () => {
    it('should log error string in pretty format', () => {
      service = createService('local');
      mockContext('trace-9');
      service.error('error occurred');
      expect(spyError).toHaveBeenCalledWith('[trace-9] error occurred');
    });

    it('should log error object in pretty format', () => {
      service = createService('local');
      mockContext('trace-10');
      const err = new Error('Boom!');
      service.error(err);
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('Boom!'));
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('Stack:'));
    });

    it('should log error string in JSON format', () => {
      service = createService('production');
      mockContext('trace-11');
      service.error('error occurred');
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('"message": "error occurred"'));
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-11"'));
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('"level": "error"'));
    });

    it('should log error object with stack trace in JSON format', () => {
      service = createService('production');
      mockContext('trace-12');
      const err = new Error('Boom!');
      service.error(err);
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('"message": "Boom!"'));
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('"errorStack"'));
      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-12"'));
    });
  });

  describe('logRequestTrace', () => {
    it('should log request trace in pretty format with all optional fields', () => {
      service = createService('local');
      mockContext('trace-13');
      service.logRequestTrace(
        { method: 'GET', originalUrl: '/path', ip: '1.1.1.1', userId: 'u1', server: 'srv1' },
        { statusCode: 200 },
        'trace-13',
        { duration: 150 },
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('(TRACE:trace-13) GET /path'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('(USER:u1)'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('(SERVER:srv1)'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('- 150ms'));
    });

    // Tests for null vs. undefined checks in duration, userId, server
    it('should log request trace in pretty format with userId only - testing truthy branches', () => {
      service = createService('local');
      mockContext('trace-13');

      // Use a plain object with userId property
      service.logRequestTrace(
        { method: 'GET', originalUrl: '/path', ip: '1.1.1.1', userId: 'u1' },
        { statusCode: 200 },
        'trace-13',
        {},
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('(USER:u1)'));
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('(SERVER:'));
    });

    it('should log request trace in pretty format with server only - testing truthy branches', () => {
      service = createService('local');
      mockContext('trace-13');

      // Use a plain object with server property
      service.logRequestTrace(
        { method: 'GET', originalUrl: '/path', ip: '1.1.1.1', server: 'srv1' },
        { statusCode: 200 },
        'trace-13',
        {},
      );
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('(USER:'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('(SERVER:srv1)'));
    });

    it('should log request trace in pretty format with duration only', () => {
      service = createService('local');
      mockContext('trace-13');
      service.logRequestTrace(
        {
          method: 'GET',
          originalUrl: '/path',
          ip: '1.1.1.1',
          userId: undefined,
          server: undefined,
        },
        { statusCode: 200 },
        'trace-13',
        { duration: 150 },
      );
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('(USER:'));
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('(SERVER:'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('- 150ms'));
    });

    it('should log request trace in pretty format without any optional fields', () => {
      service = createService('local');
      mockContext('trace-13');

      // Don't pass the extraInfo parameter to test the branch
      service.logRequestTrace(
        { method: 'GET', originalUrl: '/path', ip: '1.1.1.1' },
        { statusCode: 200 },
        'trace-13',
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('(TRACE:trace-13) GET /path'));
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('(USER:'));
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('(SERVER:'));
      expect(spyLog).toHaveBeenCalledWith(expect.not.stringContaining('- '));
    });

    it('should log request trace in JSON format with requestBody and duration', () => {
      service = createService('production');
      mockContext('trace-14');
      service.logRequestTrace(
        { method: 'POST', originalUrl: '/api', ip: '2.2.2.2', requestBody: { foo: 'bar' } },
        { statusCode: 201 },
        'trace-14',
        { duration: 500 },
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-14"'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"requestBody":'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"duration": "500ms"'));
    });

    it('should log request trace in JSON format - testing requestBody branch', () => {
      service = createService('production');
      mockContext('trace-14');

      // Use a plain object with requestBody property
      service.logRequestTrace(
        { method: 'POST', originalUrl: '/api', ip: '2.2.2.2', requestBody: { foo: 'bar' } },
        { statusCode: 201 },
        'trace-14',
        {},
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"requestBody":'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"foo": "bar"'));
    });

    it('should log request trace in JSON format with requestBody being null - testing null coalescing', () => {
      service = createService('production');
      mockContext('trace-14');

      // Create a request object with requestBody explicitly set to null
      const requestObj = {
        method: 'POST',
        originalUrl: '/api',
        ip: '2.2.2.2',
      };

      // Set requestBody to null
      Object.defineProperty(requestObj, 'requestBody', {
        value: null,
        enumerable: true,
      });

      service.logRequestTrace(requestObj, { statusCode: 201 }, 'trace-14', {});
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"requestBody": null'));
    });

    it('should log request trace in JSON format with no requestBody property', () => {
      service = createService('production');
      mockContext('trace-14');

      // Create a request object with no requestBody property at all
      const requestObj = {
        method: 'POST',
        originalUrl: '/api',
        ip: '2.2.2.2',
      };

      service.logRequestTrace(requestObj, { statusCode: 201 }, 'trace-14', {});
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"requestBody": null'));
    });

    it('should log request trace in JSON format with duration only', () => {
      service = createService('production');
      mockContext('trace-14');
      service.logRequestTrace(
        { method: 'POST', originalUrl: '/api', ip: '2.2.2.2' },
        { statusCode: 201 },
        'trace-14',
        { duration: 500 },
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"requestBody": null'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"duration": "500ms"'));
    });

    it('should log request trace in JSON format with extraInfo being null', () => {
      service = createService('production');
      mockContext('trace-14');

      // Pass null directly to test the branch
      service.logRequestTrace(
        { method: 'POST', originalUrl: '/api', ip: '2.2.2.2' },
        { statusCode: 201 },
        'trace-14',
        null,
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-14"'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"duration": null'));
    });

    it('should log request trace in JSON format with extraInfo being undefined', () => {
      service = createService('production');
      mockContext('trace-14');

      // Don't pass extraInfo parameter to test the branch
      service.logRequestTrace(
        { method: 'POST', originalUrl: '/api', ip: '2.2.2.2' },
        { statusCode: 201 },
        'trace-14',
      );
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"traceId": "trace-14"'));
      expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('"duration": null'));
    });
  });
});
