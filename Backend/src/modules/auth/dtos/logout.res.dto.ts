import { ApiProperty } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class LogoutResponseDto extends CommonResponseDto {
  @ApiProperty({ example: 'Logout successful' })
  message: string;
}
