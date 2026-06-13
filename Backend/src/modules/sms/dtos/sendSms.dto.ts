import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendSmsDto {
  @ApiPropertyOptional({ example: '+12025551234', description: 'Phone number in E.164 format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format' })
  to: string;

  @ApiPropertyOptional({ example: 'Your verification code is: 123456', description: 'SMS body text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1600, { message: 'SMS body cannot exceed 1600 characters' })
  body: string;

  @ApiPropertyOptional({ example: { userId: '123', flow: 'signup' }, description: 'Optional metadata for logging' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
