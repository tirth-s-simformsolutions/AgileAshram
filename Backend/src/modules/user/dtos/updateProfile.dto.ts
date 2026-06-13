import { PickType } from '@nestjs/swagger';
import { SignupDto } from '../../../modules/auth/dtos';

export class UpdateProfileDto extends PickType(SignupDto, ['name']) {}
