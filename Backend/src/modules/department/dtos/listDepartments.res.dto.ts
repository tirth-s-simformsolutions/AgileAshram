import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class DepartmentItemDto {
  @ApiProperty({
    example: '60d5ec49c1234567890abcde',
    description: 'Department ID (MongoDB ObjectId)',
  })
  _id: string;

  @ApiProperty({ example: 'Garbage / Waste Management Department' })
  name: string;

  @ApiProperty({
    example: [
      'Collection of household waste.',
      'Street sweeping and cleanliness.',
    ],
    description: 'List of responsibilities handled by this department',
  })
  responsibilities: string[];

  @ApiProperty({
    example: ['garbage', 'waste', 'trash', 'sanitation'],
    description: 'Keywords for improved search and matching',
  })
  keywords: string[];

  @ApiProperty({
    example: 'garbage-dept@city.gov',
    nullable: true,
    description: 'Email for verified complaint forwarding',
  })
  contactEmail?: string;

  @ApiProperty({ example: true, description: 'Whether the department is active' })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T10:30:00.000Z',
    description: 'Timestamp when department was created',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-06-13T12:45:00.000Z',
    description: 'Timestamp when department was last updated',
  })
  updatedAt: string;
}

export class ListDepartmentsDataDto {
  @ApiProperty({
    type: [DepartmentItemDto],
    description: 'Array of departments',
  })
  departments: DepartmentItemDto[];

  @ApiProperty({
    example: 5,
    description: 'Total number of departments',
  })
  total: number;
}

export class ListDepartmentsResponseDto extends PickType(CommonResponseDto, [
  'error',
] as const) {
  @ApiProperty({ example: 'Departments listed successfully' })
  message: string;

  @ApiProperty({ type: ListDepartmentsDataDto })
  data: ListDepartmentsDataDto;
}
