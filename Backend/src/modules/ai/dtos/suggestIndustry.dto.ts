import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SuggestIndustryDto {
  @ApiProperty({ example: 'There is garbage overflowing near my street and nobody has collected it for days.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Sector 12, Gandhinagar, Gujarat' })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiProperty({ example: '2026-06-13T10:30:00Z' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({ description: 'Publicly accessible URL of the complaint site image', example: 'https://example.com/complaint.jpg' })
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;
}
