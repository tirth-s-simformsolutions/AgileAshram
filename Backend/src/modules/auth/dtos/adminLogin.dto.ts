import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { VALIDATION_MSG } from '../../../common/messages';
import { UserRole } from '../../user/schemas/user.schema';
import { SignupDto } from './signup.dto';

export const LOGIN_ALLOWED_ROLES = [UserRole.ADMIN, UserRole.DEPARTMENT] as const;
export type LoginRole = (typeof LOGIN_ALLOWED_ROLES)[number];

export class AdminLoginDto extends PickType(SignupDto, ['email', 'password'] as const) {
  @ApiProperty({ enum: LOGIN_ALLOWED_ROLES, example: UserRole.ADMIN })
  @IsEnum(LOGIN_ALLOWED_ROLES, {
    message: VALIDATION_MSG.IS_ENUM('role', LOGIN_ALLOWED_ROLES.join(', ')),
  })
  @IsNotEmpty({ message: VALIDATION_MSG.NOT_EMPTY('role') })
  role: LoginRole;
}
