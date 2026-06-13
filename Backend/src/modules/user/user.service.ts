import { Injectable } from '@nestjs/common';
import { handleError } from '../../common/utils';
import { ResponseResult } from '../../core/class/';
import { UpdateProfileDto } from './dtos';
import { SUCCESS_MSG } from './messages';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string) {
    try {
      const userInfo = await this.userRepository.findUserById(userId, {
        id: true,
        name: true,
        email: true,
      });

      return new ResponseResult({
        message: SUCCESS_MSG.GET_PROFILE,
        data: userInfo,
      });
    } catch (error) {
      handleError(error);
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    try {
      const updateUserPayload = {
        name: data.name,
      };

      await this.userRepository.updateUserById(userId, updateUserPayload);

      return new ResponseResult({
        message: SUCCESS_MSG.UPDATE_PROFILE,
      });
    } catch (error) {
      handleError(error);
    }
  }
}
