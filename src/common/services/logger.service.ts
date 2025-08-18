import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV } from '../constants';
import { asyncContext as context } from '../utils';

@Injectable()
export class LoggerService extends Logger {
  private readonly isPretty: boolean;

  constructor(private readonly configService: ConfigService) {
    super();
    this.isPretty = configService.get<string>('NODE_ENV') === ENV.LOCAL;
  }

  private printFormatMessage(
    level: LogLevel,
    message: string,
    contextData: Record<string, unknown> = {},
  ) {
    const pid = process.pid;
    const contextId = context.getTraceId();

    const baseInfo: Record<string, unknown> = {
      pid,
      level,
      traceId: contextId,
      message,
    };

    const requestInfo = context.getRequestInfo();

    super[level](
      JSON.stringify(
        { ...baseInfo, ...contextData, ...(level === 'error' && requestInfo) },
        null,
        2,
      ),
    );
  }

  log(message: string) {
    if (this.isPretty) {
      super.log(`[${context.getTraceId()}] ${message}`);
    } else {
      this.printFormatMessage('log', message);
    }
  }

  error(message: string | Error) {
    if (this.isPretty) {
      if (message instanceof Error) {
        super.error(`[${context.getTraceId()}] ${message.message}\nStack: ${message.stack}`);
      } else {
        super.error(`[${context.getTraceId()}] ${message}`);
      }
    } else {
      this.printFormatMessage('error', message instanceof Error ? message.message : message, {
        errorStack: message instanceof Error ? message.stack : undefined,
      });
    }
  }

  warn(message: string) {
    if (this.isPretty) {
      super.warn(`[${context.getTraceId()}] ${message}`);
    } else {
      this.printFormatMessage('warn', message);
    }
  }

  debug(message: string) {
    if (this.isPretty) {
      super.debug(`[${context.getTraceId()}] ${message}`);
    } else {
      this.printFormatMessage('debug', message);
    }
  }

  verbose(message: string) {
    if (this.isPretty) {
      super.verbose(`[${context.getTraceId()}] ${message}`);
    } else {
      this.printFormatMessage('verbose', message);
    }
  }

  logRequestTrace(
    requestInfo: {
      method?: string;
      originalUrl?: string;
      ip?: string;
      userAgent?: string;
      server?: string;
      requestBody?: unknown;
      userId?: string;
    },
    responseInfo: { statusCode: number; data?: unknown },
    traceId: string,
    extraInfo?: { duration?: number | null },
  ) {
    const pid = process.pid;
    if (this.isPretty) {
      const duration = extraInfo?.duration ? `- ${extraInfo.duration}ms` : '';
      const userId = requestInfo?.userId ? ` (USER:${requestInfo.userId})` : '';
      const server = requestInfo?.server ? ` (SERVER:${requestInfo.server})` : '';

      // Pretty print the log
      const logMessage = `(TRACE:${traceId}) ${requestInfo.method} ${requestInfo.originalUrl} (${requestInfo.ip}) ${responseInfo.statusCode} ${duration} (PID:${pid})${userId}${server}`;

      super.log(logMessage);
    } else {
      const logObject = {
        traceId,
        method: requestInfo.method,
        originalUrl: requestInfo.originalUrl,
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        server: requestInfo.server,
        requestBody: requestInfo?.requestBody ?? null,
        userId: requestInfo.userId,
        statusCode: responseInfo.statusCode,
        duration: extraInfo?.duration ? `${extraInfo.duration}ms` : null,
        pid,
      };

      super.log(JSON.stringify(logObject, null, 2));
    }
  }
}
