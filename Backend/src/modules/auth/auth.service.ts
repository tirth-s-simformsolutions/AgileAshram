import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { compareHash, createHash, handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class/';
import { UserRole, UserStatus } from '../user/schemas/user.schema';
import { UserRepository } from '../user/user.repository';
import { AdminLoginDto, ChangePasswordDto } from './dtos';
import {
  ICookieConfig,
  ISetuInitiateResponse,
  ISetuStatusResponse,
  ITokenPayload,
  IUserValidationResult,
} from './interfaces';
import { ERROR_MSG, SUCCESS_MSG } from './messages';

@Injectable()
export class AuthService {
  private readonly accessTokenSecretKey: string;
  private readonly refreshTokenSecretKey: string;
  private readonly accessTokenExpire: number | string;
  private readonly refreshTokenExpire: number | string;
  private readonly setuBaseUrl: string;
  private readonly setuClientId: string;
  private readonly setuClientSecret: string;
  private readonly setuProductInstanceId: string;
  private readonly setuRedirectUrl: string;
  private readonly setuMockMode: boolean;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.accessTokenSecretKey = this.configService.get<string>('jwt.accessToken.secretKey');
    this.refreshTokenSecretKey = this.configService.get<string>('jwt.refreshToken.secretKey');
    this.accessTokenExpire = this.configService.get<number | string>('jwt.accessToken.expire');
    this.refreshTokenExpire = this.configService.get<number | string>('jwt.refreshToken.expire');
    this.setuBaseUrl = this.configService.get<string>('setu.baseUrl');
    this.setuClientId = this.configService.get<string>('setu.clientId');
    this.setuClientSecret = this.configService.get<string>('setu.clientSecret');
    this.setuProductInstanceId = this.configService.get<string>('setu.productInstanceId');
    this.setuRedirectUrl = this.configService.get<string>('setu.redirectUrl');
    this.setuMockMode = this.configService.get<boolean>('setu.mockMode');
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

  async adminLogin(data: AdminLoginDto, res: Response) {
    try {
      const { email, password, role } = data;

      const isUserFound = await this.userRepository.findOneByCondition({
        email,
        role,
      });

      // check user exists or not
      const isPasswordValid = isUserFound && (await compareHash(password, isUserFound.password));

      if (!isPasswordValid) {
        throw new BadRequestException(ERROR_MSG.INVALID_CREDENTIALS);
      }

      if (isUserFound.status !== UserStatus.ACTIVE) {
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

      const userInfo = await this.userRepository.findUserById(isUserFound.id);

      // Set tokens in cookies
      this.setTokenCookies(res, accessToken, refreshToken);

      return new ResponseResult({
        message: SUCCESS_MSG.USER.ADMIN_LOGIN,
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

      if (userInfo?.status !== UserStatus.ACTIVE) {
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

      const userInfo = await this.userRepository.findUserById(userId);

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

  private get setuHeaders(): Record<string, string> {
    return {
      'x-client-id': this.setuClientId,
      'x-client-secret': this.setuClientSecret,
      'x-product-instance-id': this.setuProductInstanceId,
      'Content-Type': 'application/json',
    };
  }

  async digilockerInitiate() {
    try {
      if (this.setuMockMode) {
        return new ResponseResult({
          message: SUCCESS_MSG.USER.DIGILOCKER_INITIATE,
          data: {
            setuRequestId: 'mock-request-id',
            loginUrl: 'http://mock-digilocker-login-url',
          },
        });
      }

      const response = await fetch(`${this.setuBaseUrl}/api/digilocker/`, {
        method: 'POST',
        headers: this.setuHeaders,
        body: JSON.stringify({ redirectUrl: this.setuRedirectUrl }),
      });

      if (!response.ok) {
        throw new InternalServerErrorException(ERROR_MSG.DIGILOCKER.FAILED);
      }

      const body = (await response.json()) as ISetuInitiateResponse;

      return new ResponseResult({
        message: SUCCESS_MSG.USER.DIGILOCKER_INITIATE,
        data: {
          setuRequestId: body.id,
          loginUrl: body.url,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async digilockerComplete(id: string, res: Response) {
    try {
      let digilockerId: string;
      let phoneNumber: string;

      if (this.setuMockMode) {
        digilockerId = 'DL-mock-8de97146';
        phoneNumber = '9999999999';
      } else {
        const response = await fetch(`${this.setuBaseUrl}/api/digilocker/${id}/status`, {
          method: 'GET',
          headers: this.setuHeaders,
        });

        if (!response.ok) {
          throw new InternalServerErrorException(ERROR_MSG.DIGILOCKER.FAILED);
        }

        const body = (await response.json()) as ISetuStatusResponse;

        if (body.status !== 'authenticated') {
          throw new BadRequestException(ERROR_MSG.DIGILOCKER.NOT_AUTHENTICATED);
        }

        digilockerId = body.digilockerUserDetails?.digilockerId;
        phoneNumber = body.digilockerUserDetails?.phoneNumber;
      }

      let user = await this.userRepository.findOneByCondition({ digilockerId });

      if (!user) {
        user = await this.userRepository.createUser({
          role: UserRole.CITIZEN,
          digilockerId,
          phone: phoneNumber,
          status: UserStatus.ACTIVE,
        });
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnprocessableEntityException(ERROR_MSG.USER.ACCOUNT_NOT_ACTIVE);
      }

      const accessToken = await this.jwtService.signAsync(
        { userId: user.id },
        { secret: this.accessTokenSecretKey, expiresIn: this.accessTokenExpire },
      );

      const refreshToken = await this.jwtService.signAsync(
        { userId: user.id },
        { secret: this.refreshTokenSecretKey, expiresIn: this.refreshTokenExpire },
      );

      const userInfo = await this.userRepository.findUserById(user.id);

      this.setTokenCookies(res, accessToken, refreshToken);

      return new ResponseResult({
        message: SUCCESS_MSG.USER.DIGILOCKER_LOGIN,
        data: { userInfo },
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
