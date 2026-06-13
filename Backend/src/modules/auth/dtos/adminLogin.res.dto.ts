import { ApiProperty, PickType } from '@nestjs/swagger';
import { CommonResponseDto } from '../../../common/dtos';
import { UserRole } from '../../user/schemas/user.schema';
import { LOGIN_ALLOWED_ROLES } from './adminLogin.dto';

class UserInfoDto {
  @ApiProperty({ example: '0770acc3-7ec1-4fd5-8be2-0620ec54f3b6' })
  _id: string;

  @ApiProperty({ example: 'Tom' })
  name: string;

  @ApiProperty({ example: 'tom21a211@gmail.com' })
  email: string;

  @ApiProperty({ enum: LOGIN_ALLOWED_ROLES, example: UserRole.ADMIN })
  role: string;
}

class UserAndTokenDataDto {
  @ApiProperty({ type: UserInfoDto })
  userInfo: UserInfoDto;
}

class AdminLoginResponseDto extends PickType(CommonResponseDto, ['error'] as const) {
  @ApiProperty({ example: 'Admin login successful' })
  message: string;

  @ApiProperty({ type: UserAndTokenDataDto })
  data: UserAndTokenDataDto;
}

export { AdminLoginResponseDto, UserAndTokenDataDto, UserInfoDto };
