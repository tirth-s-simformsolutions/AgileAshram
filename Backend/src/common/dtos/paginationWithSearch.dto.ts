import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class PaginationWithSearchDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'test',
  })
  @IsOptional()
  @IsString()
  search?: string = '';
}
