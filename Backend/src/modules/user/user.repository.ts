import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  createUser(userData: Partial<User>) {
    return this.userModel.create(userData);
  }

  findOneByCondition(condition: Partial<User>) {
    return this.userModel.findOne(condition).exec();
  }

  findUserById(userId: string) {
    return this.userModel.findById(userId).exec();
  }

  updateUserById(id: string, updatePayload: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, updatePayload, { new: true }).exec();
  }
}
