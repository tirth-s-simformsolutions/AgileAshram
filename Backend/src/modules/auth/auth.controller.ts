import { Body, Controller, Post, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SWAGGER_TAGS } from '../../common/constants';
import { ICurrentUser } from '../../common/interfaces';
import { CurrentUser, Public, Roles } from '../../core/decorators';
import { UserRole } from '../user/schemas/user.schema';
import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  DigilockerCompleteDto,
  DigilockerCompleteResponseDto,
  DigilockerInitiateResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
} from './dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    summary: 'DigiLocker initiate API',
    description: 'Initiates DigiLocker login for citizens — returns a loginUrl to redirect the user to',
  })
  @ApiOkResponse({
    description: 'DigiLocker login initiated',
    type: DigilockerInitiateResponseDto,
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/digilocker/initiate')
  digilockerInitiate() {
    return this.authService.digilockerInitiate();
  }

  @ApiTags(SWAGGER_TAGS.AUTH)
  @ApiOperation({
    summary: 'DigiLocker complete API',
    description: 'Completes DigiLocker login — exchanges Setu request ID for a session (sets JWT cookies)',
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: DigilockerCompleteResponseDto,
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/digilocker/complete')
  digilockerComplete(@Body() data: DigilockerCompleteDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.digilockerComplete(data.id, res);
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
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT)
  @Post('/change-password')
  changePassword(@CurrentUser() currentUser: ICurrentUser, @Body() data: ChangePasswordDto) {
    return this.authService.changePassword(currentUser.userId, data);
  }
}
