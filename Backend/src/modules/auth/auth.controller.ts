import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SWAGGER_TAGS } from '../../common/constants';
import { ICurrentUser } from '../../common/interfaces';
import { CurrentUser, Public } from '../../core/decorators';
import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  SignupDto,
  SignupResponseDto,
} from './dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiTags(SWAGGER_TAGS.AUTH)
  @ApiOperation({
    summary: 'Sign up for user API',
    description: 'This API is used to register a new user',
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: SignupResponseDto,
  })
  @Public()
  @Post('/signup')
  signup(@Body() data: SignupDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signup(data, res);
  }

  @ApiTags(SWAGGER_TAGS.AUTH)
  @ApiOperation({
    summary: 'Admin / Department login API',
    description: 'This API is used to login as admin or department user',
  })
  @ApiOkResponse({
    description: 'Admin login successful',
    type: AdminLoginResponseDto,
  })
  @Public()
  @Post('/admin/login')
  adminLogin(@Body() data: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.adminLogin(data, res);
  }

  @ApiTags(SWAGGER_TAGS.AUTH)
  @ApiOperation({
    summary: 'Refresh Token API',
    description: 'This API is used to create new access token from refresh token',
  })
  @ApiOkResponse({
    description: 'Refresh token generated successfully',
    type: RefreshTokenResponseDto,
  })
  @Public()
  @Post('/refresh-token')
  refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    return this.authService.refreshToken(refreshToken, res);
  }

  @ApiTags(SWAGGER_TAGS.AUTH)
  @ApiOperation({
    summary: 'Logout API',
    description: 'This API is used to logout and clear cookies',
  })
  @ApiOkResponse({
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @Post('/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @ApiTags(SWAGGER_TAGS.AUTH)
  @ApiOperation({
    summary: 'Change password API',
    description: 'This API is used to change password',
  })
  @ApiOkResponse({
    description: 'Change password successful',
    type: ChangePasswordResponseDto,
  })
  @Post('/change-password')
  changePassword(@CurrentUser() currentUser: ICurrentUser, @Body() data: ChangePasswordDto) {
    return this.authService.changePassword(currentUser.userId, data);
  }
}
