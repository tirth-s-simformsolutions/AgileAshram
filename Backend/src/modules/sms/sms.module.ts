import { Module } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  controllers: [SmsController],
  providers: [SmsService, LoggerService],
  exports: [SmsService],
})
export class SmsModule {}
