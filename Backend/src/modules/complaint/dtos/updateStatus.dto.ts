import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DEFAULT_MAX_LENGTH } from '../../../common/constants';
import { ComplaintStatus } from '../schemas/complaint.schema';

export class UpdateStatusDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.IN_PROGRESS })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Field team dispatched to the site.' })
  @IsString()
  @IsOptional()
  @MaxLength(DEFAULT_MAX_LENGTH)
  note?: string;
}
