import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../../common/services';
import { asyncContext as context } from '../../common/utils';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    context.run(() => {
      const traceId = context.getTraceId();
      this.logger.log(`Request started: ${req.method} ${req.originalUrl}`, traceId);

      res.on('finish', () => {
        const duration = context.getDuration();
        this.logger.log(
          `Request finished: ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
          traceId,
        );
      });

      next();
    });
  }
}
