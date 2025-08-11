import { ApiProperty } from '@nestjs/swagger';
import { ERROR_MSG } from '../messages';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { DEFAULT_MAX_LENGTH } from '../../../common/constants';
import { VALIDATION_MSG } from '../../../common/messages';
import { PASSWORD_DEFAULT_MIN_LENGTH, PASSWORD_REGEX } from '../auth.constant';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Tom@123456' })
  @IsString({ message: VALIDATION_MSG.IS_STRING('oldPassword') })
  @IsNotEmpty({ message: VALIDATION_MSG.NOT_EMPTY('oldPassword') })
  @MinLength(PASSWORD_DEFAULT_MIN_LENGTH, {
    message: VALIDATION_MSG.MIN_LENGTH('oldPassword', PASSWORD_DEFAULT_MIN_LENGTH),
  })
  @Matches(PASSWORD_REGEX, { message: ERROR_MSG.PASSWORD.INVALID_OLD_PASSWORD })
  @MaxLength(DEFAULT_MAX_LENGTH, {
    message: VALIDATION_MSG.MAX_LENGTH('oldPassword', DEFAULT_MAX_LENGTH),
  })
  oldPassword: string;

  @ApiProperty({ example: 'Tom@123456' })
  @IsString({ message: VALIDATION_MSG.IS_STRING('newPassword') })
  @IsNotEmpty({ message: VALIDATION_MSG.NOT_EMPTY('newPassword') })
  @MinLength(PASSWORD_DEFAULT_MIN_LENGTH, {
    message: VALIDATION_MSG.MIN_LENGTH('newPassword', PASSWORD_DEFAULT_MIN_LENGTH),
  })
  @Matches(PASSWORD_REGEX, { message: ERROR_MSG.PASSWORD.INVALID_NEW_PASSWORD })
  @MaxLength(DEFAULT_MAX_LENGTH, {
    message: VALIDATION_MSG.MAX_LENGTH('newPassword', DEFAULT_MAX_LENGTH),
  })
  newPassword: string;
}
