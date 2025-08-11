import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { asyncContext } from '../utils';
import { LoggerService } from './logger.service';

// Mock the asyncContext utility
jest.mock('../utils', () => ({
  asyncContext: {
    getTraceId: jest.fn(),
  },
}));

describe('LoggerService', () => {
  let service: LoggerService;
  let loggerSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let verboseSpy: jest.SpyInstance;
  let mockAsyncContext: jest.Mocked<typeof asyncContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    mockAsyncContext = asyncContext as jest.Mocked<typeof asyncContext>;

    // Spy on Logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    verboseSpy = jest.spyOn(Logger.prototype, 'verbose').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should call super.log with trace ID from context when no traceId provided', () => {
      const message = 'Test log message';
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.log(message);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(`[${contextTraceId}] ${message}`);
    });

    it('should call super.log with provided traceId when traceId is given', () => {
      const message = 'Test log message';
      const providedTraceId = 'provided-trace-456';

      service.log(message, providedTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(`[${providedTraceId}] ${message}`);
    });

    it('should handle empty string as traceId', () => {
      const message = 'Test log message';
      const emptyTraceId = '';

      service.log(message, emptyTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(`[${emptyTraceId}] ${message}`);
    });
  });

  describe('error', () => {
    it('should call super.error with trace ID from context when message is string and no traceId provided', () => {
      const message = 'Test error message';
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.error(message);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(`[${contextTraceId}] ${message}`);
    });

    it('should call super.error with provided traceId when message is string and traceId is given', () => {
      const message = 'Test error message';
      const providedTraceId = 'provided-trace-456';

      service.error(message, providedTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(`[${providedTraceId}] ${message}`);
    });

    it('should call super.error with Error message and stack when Error instance is provided without traceId', () => {
      const errorMessage = 'Test error';
      const errorStack = 'Error stack trace';
      const error = new Error(errorMessage);
      error.stack = errorStack;
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.error(error);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        `[${contextTraceId}] ${errorMessage}\nStack: ${errorStack}`,
      );
    });

    it('should call super.error with Error message and stack when Error instance is provided with traceId', () => {
      const errorMessage = 'Test error';
      const errorStack = 'Error stack trace';
      const error = new Error(errorMessage);
      error.stack = errorStack;
      const providedTraceId = 'provided-trace-456';

      service.error(error, providedTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        `[${providedTraceId}] ${errorMessage}\nStack: ${errorStack}`,
      );
    });

    it('should handle Error instance without stack trace', () => {
      const errorMessage = 'Test error without stack';
      const error = new Error(errorMessage);
      error.stack = undefined;
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.error(error);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        `[${contextTraceId}] ${errorMessage}\nStack: ${undefined}`,
      );
    });

    it('should handle string message with empty traceId', () => {
      const message = 'Test error message';
      const emptyTraceId = '';

      service.error(message, emptyTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(`[${emptyTraceId}] ${message}`);
    });
  });

  describe('warn', () => {
    it('should call super.warn with trace ID from context when no traceId provided', () => {
      const message = 'Test warn message';
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.warn(message);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(`[${contextTraceId}] ${message}`);
    });

    it('should call super.warn with provided traceId when traceId is given', () => {
      const message = 'Test warn message';
      const providedTraceId = 'provided-trace-456';

      service.warn(message, providedTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(`[${providedTraceId}] ${message}`);
    });

    it('should handle empty string as traceId', () => {
      const message = 'Test warn message';
      const emptyTraceId = '';

      service.warn(message, emptyTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(`[${emptyTraceId}] ${message}`);
    });
  });

  describe('debug', () => {
    it('should call super.debug with trace ID from context when no traceId provided', () => {
      const message = 'Test debug message';
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.debug(message);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledWith(`[${contextTraceId}] ${message}`);
    });

    it('should call super.debug with provided traceId when traceId is given', () => {
      const message = 'Test debug message';
      const providedTraceId = 'provided-trace-456';

      service.debug(message, providedTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(`[${providedTraceId}] ${message}`);
    });

    it('should handle empty string as traceId', () => {
      const message = 'Test debug message';
      const emptyTraceId = '';

      service.debug(message, emptyTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(`[${emptyTraceId}] ${message}`);
    });
  });

  describe('verbose', () => {
    it('should call super.verbose with trace ID from context when no traceId provided', () => {
      const message = 'Test verbose message';
      const contextTraceId = 'context-trace-123';

      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      service.verbose(message);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(1);
      expect(verboseSpy).toHaveBeenCalledWith(`[${contextTraceId}] ${message}`);
    });

    it('should call super.verbose with provided traceId when traceId is given', () => {
      const message = 'Test verbose message';
      const providedTraceId = 'provided-trace-456';

      service.verbose(message, providedTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(verboseSpy).toHaveBeenCalledWith(`[${providedTraceId}] ${message}`);
    });

    it('should handle empty string as traceId', () => {
      const message = 'Test verbose message';
      const emptyTraceId = '';

      service.verbose(message, emptyTraceId);

      expect(mockAsyncContext.getTraceId).not.toHaveBeenCalled();
      expect(verboseSpy).toHaveBeenCalledWith(`[${emptyTraceId}] ${message}`);
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle null and undefined values correctly', () => {
      const contextTraceId = 'context-trace-123';
      mockAsyncContext.getTraceId.mockReturnValue(contextTraceId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.log('test', null as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.warn('test', undefined as any);

      expect(mockAsyncContext.getTraceId).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith(`[${contextTraceId}] test`);
      expect(warnSpy).toHaveBeenCalledWith(`[${contextTraceId}] test`);
    });

    it('should work correctly when asyncContext returns different trace IDs', () => {
      const firstTraceId = 'trace-1';
      const secondTraceId = 'trace-2';

      mockAsyncContext.getTraceId
        .mockReturnValueOnce(firstTraceId)
        .mockReturnValueOnce(secondTraceId);

      service.log('First message');
      service.debug('Second message');

      expect(loggerSpy).toHaveBeenCalledWith(`[${firstTraceId}] First message`);
      expect(debugSpy).toHaveBeenCalledWith(`[${secondTraceId}] Second message`);
    });

    it('should handle special characters and multiline messages', () => {
      const message = 'Message with\nnewlines\tand\rspecial chars: !@#$%^&*()';
      const traceId = 'special-trace-123';

      service.log(message, traceId);

      expect(loggerSpy).toHaveBeenCalledWith(`[${traceId}] ${message}`);
    });

    it('should maintain inheritance from Logger class', () => {
      expect(service).toBeInstanceOf(Logger);
      expect(service).toBeInstanceOf(LoggerService);
    });
  });
});
