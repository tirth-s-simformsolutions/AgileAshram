import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { DEFAULT_MAX_LENGTH } from '../../../common/constants';
import { ComplaintStatus } from '../schemas/complaint.schema';

export class ResolutionNoteDto {
  @ApiProperty({ example: 'Pothole has been filled and the road surface repaired.' })
  @IsString()
  comment: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/resolved.jpg',
    description: 'Photo evidence of the resolution',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.IN_PROGRESS })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Field team dispatched to the site.' })
  @IsString()
  @IsOptional()
  @MaxLength(DEFAULT_MAX_LENGTH)
  note?: string;

  @ApiPropertyOptional({
    type: ResolutionNoteDto,
    description: 'Required when status is RESOLVED — admin/department final comment with optional photo evidence.',
  })
  @ValidateNested()
  @Type(() => ResolutionNoteDto)
  @IsOptional()
  resolutionNote?: ResolutionNoteDto;
}
