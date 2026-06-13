import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../common/services/logger.service';
import { SendSmsDto } from './dtos';
import { SmsService } from './sms.service';

jest.mock('twilio', () =>
  jest.fn(() => ({
    messages: {
      create: jest.fn().mockRejectedValue(new Error('Twilio not mocked')),
    },
  })),
);

describe('SmsService', () => {
  let service: SmsService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLoggerService = {
    debug: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get
      .mockReturnValueOnce('test-account-sid')
      .mockReturnValueOnce('test-auth-token')
      .mockReturnValueOnce('+1234567890');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should throw BadRequestException with INVALID_PAYLOAD when phone is not E.164', async () => {
      const invalidDto = { to: 'invalid-phone', body: 'test' } as SendSmsDto;

      await expect(service.send(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with INVALID_PAYLOAD when body is empty', async () => {
      const invalidDto = { to: '+12025551234', body: '' } as SendSmsDto;

      await expect(service.send(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });
});
