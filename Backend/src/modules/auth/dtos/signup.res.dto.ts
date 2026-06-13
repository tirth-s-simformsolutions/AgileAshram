import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserAndTokenDataDto } from './login.res.dto';
import { CommonResponseDto } from '../../../common/dtos';

export class SignupResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'User created successfully' })
  message: string;

  @ApiProperty({ type: UserAndTokenDataDto })
  data: UserAndTokenDataDto;
}
