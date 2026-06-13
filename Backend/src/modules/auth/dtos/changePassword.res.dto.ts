import { ApiProperty } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

export class ChangePasswordResponseDto extends CommonResponseDto {
  @ApiProperty({ example: 'Change password successful' })
  message: string;
}
