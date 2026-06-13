import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DEFAULT_MAX_LENGTH } from '../../../common/constants';

export class ReassignDepartmentDto {
  @ApiProperty({
    example: '665f1b2e3c4a5d6e7f8a9b0c',
    description: 'MongoDB ObjectId of the target department',
  })
  @IsMongoId()
  departmentId: string;

  @ApiProperty({ example: 'Rerouted — better handled by Sanitation department.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(DEFAULT_MAX_LENGTH)
  note: string;
}
