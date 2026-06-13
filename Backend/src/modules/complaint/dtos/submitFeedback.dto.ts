import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SubmitFeedbackDto {
  @ApiProperty({ example: 4, description: 'Rating from 1 (poor) to 5 (excellent)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'The team resolved the issue quickly and professionally.' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
