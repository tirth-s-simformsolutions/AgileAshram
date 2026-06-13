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
}

export class ListDepartmentsDataDto {
  @ApiProperty({
    type: [DepartmentItemDto],
    description: 'Array of departments',
  })
  departments: DepartmentItemDto[];

  @ApiProperty({ example: 5, description: 'Total number of departments' })
  total: number;

  @ApiProperty({ example: 0, description: 'Current page (0-indexed)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  pageSize: number;
}

export class ListDepartmentsResponseDto extends PickType(CommonResponseDto, [
  'error',
] as const) {
  @ApiProperty({ example: 'Departments listed successfully' })
  message: string;

  @ApiProperty({ type: ListDepartmentsDataDto })
  data: ListDepartmentsDataDto;
}
