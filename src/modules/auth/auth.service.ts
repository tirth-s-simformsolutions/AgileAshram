import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { Response } from 'express';
import { compareHash, createHash, handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class/';
import { UserRepository } from '../user/user.repository';
import { ChangePasswordDto, LoginDto, SignupDto } from './dtos';
import { ICookieConfig, ITokenPayload, IUserValidationResult } from './interfaces';
import { ERROR_MSG, SUCCESS_MSG } from './messages';

@Injectable()
export class AuthService {
  private readonly accessTokenSecretKey: string;
  private readonly refreshTokenSecretKey: string;
  private readonly accessTokenExpire: number | string;
  private readonly refreshTokenExpire: number | string;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.accessTokenSecretKey = this.configService.get<string>('jwt.accessToken.secretKey');
    this.refreshTokenSecretKey = this.configService.get<string>('jwt.refreshToken.secretKey');
    this.accessTokenExpire = this.configService.get<number | string>('jwt.accessToken.expire');
    this.refreshTokenExpire = this.configService.get<number | string>('jwt.refreshToken.expire');
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    const cookieConfig: Omit<ICookieConfig, 'maxAge'> = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    // Set access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieConfig,
      maxAge: this.getTokenExpiry(this.accessTokenExpire),
    });

    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      ...cookieConfig,
      maxAge: this.getTokenExpiry(this.refreshTokenExpire),
    });
  }

  private getTokenExpiry(expire: string | number): number {
    if (typeof expire === 'number') return expire * 1000;

    // Parse string like "15m", "7d", etc.
    const unit = expire.slice(-1);
    const value = parseInt(expire.slice(0, -1));

    switch (unit) {
      case 'm':
        return value * 60 * 1000; // minutes
      case 'h':
        return value * 60 * 60 * 1000; // hours
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days
      default:
        return 15 * 60 * 1000; // default 15 minutes
    }
  }

  async signup(data: SignupDto, res: Response) {
    try {
      const { email, password, name } = data;

      // validate user email
      await this.validateUserBeforeCreate({ email });

      const createUserPayload = {
        email,
        password: await createHash(password),
        name,
        status: UserStatus.active,
      };

      const createdUserInfo = await this.userRepository.createUser(createUserPayload);

      const accessToken = await this.jwtService.signAsync(
        {
          userId: createdUserInfo.id,
        },
        {
          secret: this.accessTokenSecretKey,
          expiresIn: this.accessTokenExpire,
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        {
          userId: createdUserInfo.id,
        },
        {
          secret: this.refreshTokenSecretKey,
          expiresIn: this.refreshTokenExpire,
        },
      );

      const userInfo = await this.userRepository.findUserById(createdUserInfo.id, {
        id: true,
        email: true,
        name: true,
      });

      // Set tokens in cookies
      this.setTokenCookies(res, accessToken, refreshToken);

      return new ResponseResult({
        message: SUCCESS_MSG.USER.CREATED,
        statusCode: HttpStatus.CREATED,
        data: {
          userInfo,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async validateUserBeforeCreate({ email }: Partial<SignupDto>) {
    // Check user exists with same email
    const isEmailRegistered = await this.userRepository.findOneByCondition({
      email,
    });
    if (isEmailRegistered) {
      throw new ConflictException(ERROR_MSG.USER.USER_EXISTS_WITH_SAME_EMAIL);
    }
  }

  async login(data: LoginDto, res: Response) {
    try {
      const { email, password } = data;

      const isUserFound = await this.userRepository.findOneByCondition({
        email,
      });

      // check user exists or not
      const isPasswordValid = isUserFound && (await compareHash(password, isUserFound.password));

      if (!isPasswordValid) {
        throw new BadRequestException(ERROR_MSG.INVALID_CREDENTIALS);
      }

      if (isUserFound.status !== UserStatus.active) {
        throw new UnprocessableEntityException(ERROR_MSG.USER.ACCOUNT_NOT_ACTIVE);
      }

      const accessToken = await this.jwtService.signAsync(
        {
          userId: isUserFound.id,
        },
        {
          secret: this.accessTokenSecretKey,
          expiresIn: this.accessTokenExpire,
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        {
          userId: isUserFound.id,
        },
        {
          secret: this.refreshTokenSecretKey,
          expiresIn: this.refreshTokenExpire,
        },
      );

      const userInfo = await this.userRepository.findUserById(isUserFound.id, {
        id: true,
        email: true,
        name: true,
      });

      // Set tokens in cookies
      this.setTokenCookies(res, accessToken, refreshToken);

      return new ResponseResult({
        message: SUCCESS_MSG.USER.LOGIN,
        data: {
          userInfo,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async refreshToken(refreshToken: string, res: Response) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException(ERROR_MSG.UNAUTHORIZED);
      }

      const tokenData = await this.jwtService.verifyAsync<ITokenPayload>(refreshToken, {
        secret: this.refreshTokenSecretKey,
      });

      if (!tokenData?.userId) {
        throw new UnauthorizedException(ERROR_MSG.UNAUTHORIZED);
      }

      const userInfo = await this.userRepository.findUserById(tokenData.userId);

      if (userInfo?.status !== UserStatus.active) {
        throw new UnauthorizedException(ERROR_MSG.USER.ACCOUNT_NOT_ACTIVE);
      }

      const accessToken = await this.jwtService.signAsync(
        {
          userId: userInfo.id,
        },
        {
          secret: this.accessTokenSecretKey,
          expiresIn: this.accessTokenExpire,
        },
      );
      const newRefreshToken = await this.jwtService.signAsync(
        {
          userId: userInfo.id,
        },
        {
          secret: this.refreshTokenSecretKey,
          expiresIn: this.refreshTokenExpire,
        },
      );

      // Set new tokens in cookies
      this.setTokenCookies(res, accessToken, newRefreshToken);

      return new ResponseResult<null>({
        message: SUCCESS_MSG.USER.REFRESH_TOKEN,
        data: null,
      });
    } catch (error) {
      if (
        error?.name === 'TokenExpiredError' ||
        error?.name === 'JsonWebTokenError' ||
        (error?.message && error?.message === 'jwt expired')
      ) {
        handleError(new UnauthorizedException(ERROR_MSG.TOKEN_EXPIRED));
      }
      handleError(error);
    }
  }

  async logout(res: Response) {
    try {
      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return new ResponseResult<null>({
        message: SUCCESS_MSG.USER.LOGOUT,
        data: null,
      });
    } catch (error) {
      handleError(error);
    }
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    try {
      const { newPassword, oldPassword } = data;

      const userInfo = await this.userRepository.findUserById(userId, {
        password: true,
      });

      if (newPassword === oldPassword) {
        throw new BadRequestException(ERROR_MSG.PASSWORD.SAME_PASSWORD);
      }

      // check old password
      if (!(await compareHash(oldPassword, userInfo.password))) {
        throw new ConflictException(ERROR_MSG.PASSWORD.INVALID_OLD_PASSWORD);
      }

      const newPasswordHash = await createHash(newPassword);

      await this.userRepository.updateUserById(userId, {
        password: newPasswordHash,
      });

      return new ResponseResult<null>({
        message: SUCCESS_MSG.USER.CHANGE_PASSWORD,
      });
    } catch (error) {
      handleError(error);
    }
  }

  async validateAccessToken(token: string): Promise<IUserValidationResult> {
    try {
      // check token
      if (!token) {
        throw new UnauthorizedException(ERROR_MSG.UNAUTHORIZED);
      }

      const decode = await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: this.accessTokenSecretKey,
      });

      if (!decode?.userId) {
        throw new UnauthorizedException(ERROR_MSG.UNAUTHORIZED);
      }

      const loginUserInfo = await this.userRepository.findUserById(decode?.userId);

      if (!loginUserInfo) {
        throw new UnauthorizedException(ERROR_MSG.UNAUTHORIZED);
      }

      if (loginUserInfo.status !== UserStatus.active) {
        throw new UnauthorizedException(ERROR_MSG.USER.ACCOUNT_NOT_ACTIVE);
      }

      return {
        userId: loginUserInfo.id,
        name: loginUserInfo.name,
      };
    } catch (error) {
      if (
        error?.name === 'TokenExpiredError' ||
        error?.name === 'JsonWebTokenError' ||
        (error?.message && error?.message === 'jwt expired')
      ) {
        handleError(new UnauthorizedException(ERROR_MSG.TOKEN_EXPIRED));
      }
      handleError(error);
    }
  }
}
