import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ValidateComplaintDto {
  @ApiProperty({ example: 'There is garbage overflowing near my street and nobody has collected it for days.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'Sector 12, Gandhinagar, Gujarat' })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiProperty({ description: 'Publicly accessible URL of the complaint site image', example: 'https://example.com/complaint.jpg' })
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;
}
