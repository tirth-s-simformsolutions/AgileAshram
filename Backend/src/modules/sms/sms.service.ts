import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import type { Twilio as TwilioClient } from 'twilio';
import { LoggerService } from '../../common/services/logger.service';
import { SendSmsDto } from './dtos';
import { SmsErrorCode } from './enums/sms.enum';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const twilioFactory: (accountSid: string, authToken: string) => TwilioClient = require('twilio');

export interface SendSmsResponse {
  sid: string;
  status: string;
}

@Injectable()
export class SmsService {
  private readonly twilioClient: TwilioClient;
  private readonly fromNumber: string;
  private readonly logger: LoggerService;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = loggerService;
    const accountSid = this.configService.get<string>('twilio.accountSid');
    const authToken = this.configService.get<string>('twilio.authToken');
    this.fromNumber = this.configService.get<string>('twilio.from');

    this.twilioClient = twilioFactory(accountSid, authToken);
  }

  async send(dto: SendSmsDto): Promise<SendSmsResponse> {
    const plainDto = plainToInstance(SendSmsDto, dto);

    try {
      await validateOrReject(plainDto);
    } catch {
      throw new BadRequestException(SmsErrorCode.INVALID_PAYLOAD);
    }

    this.logger.debug(
      JSON.stringify({
        action: 'Sending SMS',
        to: dto.to,
        metadata: dto.metadata,
      }),
    );

    try {
      const message = await this.twilioClient.messages.create({
        body: dto.body,
        from: this.fromNumber,
        to: dto.to,
      });

      this.logger.debug(
        JSON.stringify({
          action: 'SMS sent successfully',
          to: dto.to,
          sid: message.sid,
          status: message.status,
          metadata: dto.metadata,
        }),
      );

      return {
        sid: message.sid,
        status: message.status,
      };
    } catch (error) {
      const mappedError = this.mapTwilioError(error);
      this.logger.error(
        JSON.stringify({
          action: 'SMS delivery failed',
          to: dto.to,
          errorCode: mappedError,
          twilioCode: error?.code,
          metadata: dto.metadata,
        }),
      );

      throw new InternalServerErrorException(mappedError);
    }
  }

  private mapTwilioError(error: unknown): SmsErrorCode {
    const twilioCode = (error as Record<string, unknown>)?.code as number | undefined;

    if ([21211, 21614].includes(twilioCode || 0)) {
      return SmsErrorCode.INVALID_PHONE;
    }

    if ([21408, 21610].includes(twilioCode || 0)) {
      return SmsErrorCode.DELIVERY_FAILED;
    }

    if ([14107, 20429].includes(twilioCode || 0)) {
      return SmsErrorCode.RATE_LIMITED;
    }

    return SmsErrorCode.PROVIDER_ERROR;
  }
}
