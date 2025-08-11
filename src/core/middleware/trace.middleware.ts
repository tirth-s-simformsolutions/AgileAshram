import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../../common/services';
import { asyncContext as context } from '../../common/utils';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    context.run(() => {
      const traceId = context.getTraceId();

      context.setRequestInfo(
        req.method,
        req.originalUrl,
        req.ip,
        req.headers['user-agent'] || 'unknown',
        req?.body,
      );

      res.on('finish', () => {
        if (req?.userId) {
          context.setUser(req.userId);
        }
        const duration = context.getDuration();
        const requestInfo = context.getRequestInfo();
        this.logger.logRequestTrace(
          { ...requestInfo, userId: req?.userId },
          {
            statusCode: res.statusCode,
          },
          traceId,
          { duration },
        );
      });

      next();
    });
  }
}
