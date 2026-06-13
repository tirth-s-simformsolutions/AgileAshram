import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

class LocationDto {
  @ApiProperty({ example: 23.0225 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 72.5714 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: 'Sector 12, Gandhinagar, Gujarat' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateComplaintDto {
  @ApiProperty({
    example: 'There is garbage overflowing near my street and nobody has collected it for days.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Publicly accessible URL of the complaint site image',
    example: 'https://res.cloudinary.com/demo/image/upload/complaint.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
