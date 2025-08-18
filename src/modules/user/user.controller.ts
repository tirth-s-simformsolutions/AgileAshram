import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SWAGGER_TAGS } from '../../common/constants';
import { ICurrentUser } from '../../common/interfaces';
import { CurrentUser } from '../../core/decorators';
import { GetProfileResponseDto, UpdateProfileDto, UpdateProfileResponseDto } from './dtos';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiTags(SWAGGER_TAGS.USER)
  @ApiOperation({
    summary: 'Get profile API',
    description: 'This API is used to get profile',
  })
  @ApiOkResponse({
    description: 'Profile fetched successfully',
    type: GetProfileResponseDto,
  })
  @Get('/profile')
  getProfile(@CurrentUser() currentUser: ICurrentUser) {
    return this.userService.getProfile(currentUser.userId);
  }

  @ApiTags(SWAGGER_TAGS.USER)
  @ApiOperation({
    summary: 'Update profile API',
    description: 'This API is used to update profile',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: UpdateProfileResponseDto,
  })
  @Put('/profile')
  updateProfile(@CurrentUser() currentUser: ICurrentUser, @Body() data: UpdateProfileDto) {
    return this.userService.updateProfile(currentUser.userId, data);
  }
}
