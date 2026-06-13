import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { DEFAULT_MAX_LENGTH } from '../../../common/constants';

export class ReassignDepartmentDto {
  @ApiProperty({ example: '665f1b2e3c4a5d6e7f8a9b0c', description: 'MongoDB ObjectId of the target department' })
  @IsMongoId()
  departmentId: string;

  @ApiPropertyOptional({ example: 'Rerouted — better handled by Sanitation department.' })
  @IsString()
  @IsOptional()
  @MaxLength(DEFAULT_MAX_LENGTH)
  note?: string;
}
