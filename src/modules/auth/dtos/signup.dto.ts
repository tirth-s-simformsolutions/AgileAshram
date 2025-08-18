import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { DEFAULT_MAX_LENGTH } from '../../../common/constants';
import { VALIDATION_MSG } from '../../../common/messages';
import { ERROR_MSG } from '../messages';
import { PASSWORD_DEFAULT_MIN_LENGTH, PASSWORD_REGEX } from '../auth.constant';

export class SignupDto {
  @ApiProperty({ example: 'Tom' })
  @IsString({ message: VALIDATION_MSG.IS_STRING('name') })
  @IsNotEmpty({
    message: VALIDATION_MSG.NOT_EMPTY('name'),
  })
  @MaxLength(DEFAULT_MAX_LENGTH, {
    message: VALIDATION_MSG.MAX_LENGTH('name', DEFAULT_MAX_LENGTH),
  })
  name: string;

  @ApiProperty({ example: 'tom@gmail.com' })
  @Transform(({ value }) => value.trim())
  @Transform(({ value }) => value.toLowerCase())
  @IsEmail({}, { message: VALIDATION_MSG.IS_EMAIL('email') })
  @MaxLength(DEFAULT_MAX_LENGTH, {
    message: VALIDATION_MSG.MAX_LENGTH('email', DEFAULT_MAX_LENGTH),
  })
  email: string;

  @ApiProperty({ example: 'Tom@123456' })
  @IsString({ message: VALIDATION_MSG.IS_STRING('password') })
  @IsNotEmpty({ message: VALIDATION_MSG.NOT_EMPTY('password') })
  @MinLength(PASSWORD_DEFAULT_MIN_LENGTH, {
    message: VALIDATION_MSG.MIN_LENGTH('password', PASSWORD_DEFAULT_MIN_LENGTH),
  })
  @Matches(PASSWORD_REGEX, { message: ERROR_MSG.PASSWORD.INVALID_PASSWORD })
  @MaxLength(DEFAULT_MAX_LENGTH, {
    message: VALIDATION_MSG.MAX_LENGTH('password', DEFAULT_MAX_LENGTH),
  })
  password: string;
}
