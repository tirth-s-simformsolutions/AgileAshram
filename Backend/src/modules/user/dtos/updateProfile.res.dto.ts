import { ApiProperty } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class UpdateProfileResponseDto extends CommonResponseDto {
  @ApiProperty({ example: 'Profile updated successfully' })
  message: string;
}
