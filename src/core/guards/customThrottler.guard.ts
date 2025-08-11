import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: Request): Promise<string> {
    return request['userId'] ?? (request.ips.length ? request.ips[0] : request.ip);
  }
}
