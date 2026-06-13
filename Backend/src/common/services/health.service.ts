import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ResponseResult } from '../../core/class';
import { SUCCESS_MSG } from '../messages';
import { handleError } from '../utils';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async check() {
    try {
      // Check MongoDB connection
      await this.connection.db.admin().ping();
      return new ResponseResult({
        message: SUCCESS_MSG.OK,
        data: { uptime: process.uptime() },
      });
    } catch (error) {
      handleError(error);
    }
  }
}
