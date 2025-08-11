import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvVariablesDto } from '../dtos';

export const handleError = (error: Error): void => {
  if (error instanceof HttpException) {
    throw new HttpException({ message: error.message }, error.getStatus());
  } else {
    throw new InternalServerErrorException(error);
  }
};

export const validateEnvVariables = (config: Record<string, unknown>) => {
  const validatedConfig = plainToInstance(EnvVariablesDto, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map(error => Object.values(error.constraints ?? {}).join(', '))
      .join(', ');
    throw new Error(`Environment Variables Validation Failed: ${errorMessages}`);
  }
  return validatedConfig;
};

export const sanitize = (obj: unknown, sensitiveKeys: string[], depth: number = 0): unknown => {
  try {
    if (depth > 10) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item, sensitiveKeys, depth + 1));
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const isSensitive = sensitiveKeys.some(sensitiveKey =>
          key.toLowerCase().includes(sensitiveKey),
        );
        sanitized[key] = isSensitive ? '[REDACTED]' : sanitize(value, sensitiveKeys, depth + 1);
      }
      return sanitized;
    }
  } catch {
    // If sanitization fails, return the original object
  }
  return obj;
};
