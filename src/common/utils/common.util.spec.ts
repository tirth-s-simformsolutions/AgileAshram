import {
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { handleError, sanitize, validateEnvVariables } from './common.util';

// Mock the DTO import to avoid decorator issues
jest.mock('../dtos', () => ({
  EnvVariablesDto: class MockEnvVariablesDto {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    SENTRY_DSN?: string;
    JWT_ACCESS_TOKEN_EXPIRE: string;
    JWT_REFRESH_TOKEN_EXPIRE: string;
    JWT_ACCESS_SECRET_KEY: string;
    JWT_REFRESH_SECRET_KEY: string;
  },
}));

// Mock class-validator and class-transformer
jest.mock('class-validator');
jest.mock('class-transformer');

describe('Common Utility', () => {
  const mockValidateSync = validateSync as jest.MockedFunction<typeof validateSync>;
  const mockPlainToInstance = plainToInstance as jest.MockedFunction<typeof plainToInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should re-throw HttpException with same message and status', () => {
      const originalError = new BadRequestException('Invalid input data');

      expect(() => handleError(originalError)).toThrow(HttpException);

      try {
        handleError(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect((error as HttpException).getResponse()).toEqual({
          message: 'Invalid input data',
        });
      }
    });

    it('should wrap non-HttpException errors in InternalServerErrorException', () => {
      const originalError = new Error('Database connection failed');

      expect(() => handleError(originalError)).toThrow(InternalServerErrorException);

      try {
        handleError(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect((error as InternalServerErrorException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    it('should handle TypeError correctly', () => {
      const originalError = new TypeError('Cannot read property of undefined');

      expect(() => handleError(originalError)).toThrow(InternalServerErrorException);
    });

    it('should handle ReferenceError correctly', () => {
      const originalError = new ReferenceError('Variable is not defined');

      expect(() => handleError(originalError)).toThrow(InternalServerErrorException);
    });

    it('should handle custom HttpException with custom status', () => {
      const originalError = new HttpException('Forbidden access', HttpStatus.FORBIDDEN);

      try {
        handleError(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.FORBIDDEN);
        expect((error as HttpException).getResponse()).toEqual({
          message: 'Forbidden access',
        });
      }
    });
  });

  describe('validateEnvVariables', () => {
    const mockConfig = {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_ACCESS_TOKEN_EXPIRE: '15m',
      JWT_REFRESH_TOKEN_EXPIRE: '7d',
      JWT_ACCESS_SECRET_KEY: 'access-secret',
      JWT_REFRESH_SECRET_KEY: 'refresh-secret',
    };

    it('should return validated config when validation passes', () => {
      const transformedConfig = { ...mockConfig };

      mockPlainToInstance.mockReturnValue(transformedConfig);
      mockValidateSync.mockReturnValue([]); // No validation errors

      const result = validateEnvVariables(mockConfig);

      expect(mockPlainToInstance).toHaveBeenCalledWith(
        expect.any(Function), // EnvVariablesDto class
        mockConfig,
        { enableImplicitConversion: true },
      );
      expect(mockValidateSync).toHaveBeenCalledWith(transformedConfig, {
        skipMissingProperties: false,
      });
      expect(result).toEqual(transformedConfig);
    });

    it('should throw error when validation fails with single constraint', () => {
      const transformedConfig = { ...mockConfig };
      const mockError = {
        constraints: {
          isNotEmpty: 'DATABASE_URL should not be empty',
        },
      };

      mockPlainToInstance.mockReturnValue(transformedConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockValidateSync.mockReturnValue([mockError] as any);

      expect(() => validateEnvVariables(mockConfig)).toThrow(
        'Environment Variables Validation Failed: DATABASE_URL should not be empty',
      );
    });

    it('should throw error when validation fails with multiple constraints', () => {
      const transformedConfig = { ...mockConfig };
      const mockError = {
        constraints: {
          isNotEmpty: 'DATABASE_URL should not be empty',
          isString: 'DATABASE_URL must be a string',
        },
      };

      mockPlainToInstance.mockReturnValue(transformedConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockValidateSync.mockReturnValue([mockError] as any);

      expect(() => validateEnvVariables(mockConfig)).toThrow(
        'Environment Variables Validation Failed: DATABASE_URL should not be empty, DATABASE_URL must be a string',
      );
    });

    it('should throw error when validation fails with multiple errors', () => {
      const transformedConfig = { ...mockConfig };
      const mockErrors = [
        {
          constraints: {
            isNotEmpty: 'DATABASE_URL should not be empty',
          },
        },
        {
          constraints: {
            isNumber: 'PORT must be a number',
          },
        },
      ];

      mockPlainToInstance.mockReturnValue(transformedConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockValidateSync.mockReturnValue(mockErrors as any);

      expect(() => validateEnvVariables(mockConfig)).toThrow(
        'Environment Variables Validation Failed: DATABASE_URL should not be empty, PORT must be a number',
      );
    });

    it('should handle errors without constraints property', () => {
      const transformedConfig = { ...mockConfig };
      const mockError = {}; // No constraints property

      mockPlainToInstance.mockReturnValue(transformedConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockValidateSync.mockReturnValue([mockError] as any);

      expect(() => validateEnvVariables(mockConfig)).toThrow(
        'Environment Variables Validation Failed: ',
      );
    });

    it('should handle empty constraints object', () => {
      const transformedConfig = { ...mockConfig };
      const mockError = {
        constraints: {},
      };

      mockPlainToInstance.mockReturnValue(transformedConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockValidateSync.mockReturnValue([mockError] as any);

      expect(() => validateEnvVariables(mockConfig)).toThrow(
        'Environment Variables Validation Failed: ',
      );
    });

    it('should call plainToInstance with correct parameters', () => {
      mockPlainToInstance.mockReturnValue(mockConfig);
      mockValidateSync.mockReturnValue([]);

      validateEnvVariables(mockConfig);

      expect(mockPlainToInstance).toHaveBeenCalledTimes(1);
      expect(mockPlainToInstance).toHaveBeenCalledWith(expect.any(Function), mockConfig, {
        enableImplicitConversion: true,
      });
    });

    it('should call validateSync with correct parameters', () => {
      const transformedConfig = { ...mockConfig };
      mockPlainToInstance.mockReturnValue(transformedConfig);
      mockValidateSync.mockReturnValue([]);

      validateEnvVariables(mockConfig);

      expect(mockValidateSync).toHaveBeenCalledTimes(1);
      expect(mockValidateSync).toHaveBeenCalledWith(transformedConfig, {
        skipMissingProperties: false,
      });
    });
  });

  describe('sanitize', () => {
    it('should redact sensitive keys in objects', () => {
      const testObject = {
        username: 'test',
        password: 'secret123',
        data: {
          apiKey: 'abc123',
          userId: 123,
        },
      };

      const sensitiveKeys = ['password', 'key'];
      const result = sanitize(testObject, sensitiveKeys);

      expect(result).toEqual({
        username: 'test',
        password: '[REDACTED]',
        data: {
          apiKey: '[REDACTED]',
          userId: 123,
        },
      });
    });

    it('should sanitize arrays of objects', () => {
      const testArray = [
        { id: 1, secret: 'hidden1' },
        { id: 2, secret: 'hidden2' },
      ];

      const sensitiveKeys = ['secret'];
      const result = sanitize(testArray, sensitiveKeys);

      expect(result).toEqual([
        { id: 1, secret: '[REDACTED]' },
        { id: 2, secret: '[REDACTED]' },
      ]);
    });

    it('should handle nested arrays', () => {
      const nestedArray = [
        [
          { apiKey: 'key1', data: 'public1' },
          { apiKey: 'key2', data: 'public2' },
        ],
        [{ apiKey: 'key3', data: 'public3' }],
      ];

      const sensitiveKeys = ['apikey'];
      const result = sanitize(nestedArray, sensitiveKeys);

      expect(result).toEqual([
        [
          { apiKey: '[REDACTED]', data: 'public1' },
          { apiKey: '[REDACTED]', data: 'public2' },
        ],
        [{ apiKey: '[REDACTED]', data: 'public3' }],
      ]);
    });

    it('should return primitive values unchanged', () => {
      expect(sanitize('string', ['password'])).toBe('string');
      expect(sanitize(123, ['password'])).toBe(123);
      expect(sanitize(true, ['password'])).toBe(true);
      expect(sanitize(null, ['password'])).toBe(null);
      expect(sanitize(undefined, ['password'])).toBe(undefined);
    });

    it('should handle nested objects', () => {
      const nestedObject = {
        user: {
          details: {
            name: 'John',
            credentials: {
              password: '12345',
              token: 'abcde',
            },
          },
          publicInfo: {
            displayName: 'John Doe',
          },
        },
      };

      const sensitiveKeys = ['password', 'token', 'credentials'];
      const result = sanitize(nestedObject, sensitiveKeys);

      expect(result).toEqual({
        user: {
          details: {
            name: 'John',
            credentials: '[REDACTED]',
          },
          publicInfo: {
            displayName: 'John Doe',
          },
        },
      });
    });

    it('should handle case-insensitive key matching', () => {
      const testObject = {
        Password: 'secret',
        TOKEN: 'abc123',
        apikey: '12345',
      };

      const sensitiveKeys = ['password', 'token', 'key'];
      const result = sanitize(testObject, sensitiveKeys);

      expect(result).toEqual({
        Password: '[REDACTED]',
        TOKEN: '[REDACTED]',
        apikey: '[REDACTED]',
      });
    });

    it('should handle empty arrays and objects', () => {
      expect(sanitize([], ['password'])).toEqual([]);
      expect(sanitize({}, ['password'])).toEqual({});
    });

    it('should return original object if sanitization throws an error', () => {
      // Create an object that will cause an error during sanitization
      const problemObject = {};
      Object.defineProperty(problemObject, 'problematic', {
        get: () => {
          throw new Error('Intentional error');
        },
        enumerable: true,
      });

      // The sanitize function should catch the error and return the original
      const result = sanitize(problemObject, ['secret']);
      expect(result).toBe(problemObject);
    });
  });
});
