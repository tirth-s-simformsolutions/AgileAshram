import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '../../common/constants';
import { handleError } from '../../common/utils';
import { AuthService } from '../../modules/auth/auth.service';
import { ERROR_MSG as AUTH_ERROR_MSG } from '../../modules/auth/messages';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const isPublic = this.reflector.get<string>(IS_PUBLIC, context.getHandler());

      if (isPublic) {
        return true;
      }

      // Get token from cookies instead of authorization header
      const token = request.cookies?.access_token;

      if (!token) {
        throw new UnauthorizedException(AUTH_ERROR_MSG.UNAUTHORIZED);
      }

      const userInfo = await this.authService.validateAccessToken(token);

      request.userId = userInfo.userId;
      request.name = userInfo.name;

      return true;
    } catch (error) {
      handleError(error);
    }
  }
}
