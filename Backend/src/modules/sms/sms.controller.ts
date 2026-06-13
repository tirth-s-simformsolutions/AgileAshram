import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { Public } from '../../core/decorators';
import { SendSmsHealthDto } from './dtos';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @ApiTags(SWAGGER_TAGS.SMS)
  @ApiOperation({
    summary: 'SMS health check',
    description: 'Sends a test SMS to verify Twilio credentials and connectivity.',
  })
  @ApiOkResponse({ description: 'SMS sent successfully' })
  @Public()
  @Post('health')
  sendHealthSms(@Body() body: SendSmsHealthDto) {
    return this.smsService.send({
      to: body.to,
      body: 'NagarVaani SMS health check — delivery confirmed.',
      metadata: { source: 'health-check' },
    });
  }
}
