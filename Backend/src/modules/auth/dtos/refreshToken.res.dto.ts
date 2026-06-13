import { ApiProperty } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class RefreshTokenResponseDto extends CommonResponseDto {
  @ApiProperty({ example: 'Refresh token generated successfully' })
  message: string;
}
