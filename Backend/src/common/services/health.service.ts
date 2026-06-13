import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ResponseResult } from '../../core/class';
import { SUCCESS_MSG } from '../messages';
import { handleError } from '../utils';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async check() {
    try {
      // Check database connection
      await this.prismaService.$queryRaw`SELECT 1`;

      return new ResponseResult({
        message: SUCCESS_MSG.OK,
        data: { uptime: process.uptime() },
      });
    } catch (error) {
      handleError(error);
    }
  }
}
