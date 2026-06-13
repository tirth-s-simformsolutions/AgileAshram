import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';

class UserInfoDto {
  @ApiProperty({ example: '0770acc3-7ec1-4fd5-8be2-0620ec54f3b6' })
  id: string;

  @ApiProperty({ example: 'Tom' })
  name: string;

  @ApiProperty({ example: 'tom21a211@gmail.com' })
  email: string;
}

class UserAndTokenDataDto {
  @ApiProperty({ type: UserInfoDto })
  userInfo: UserInfoDto;
}

class LoginResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: UserAndTokenDataDto })
  data: UserAndTokenDataDto;
}

export { LoginResponseDto, UserAndTokenDataDto, UserInfoDto };
