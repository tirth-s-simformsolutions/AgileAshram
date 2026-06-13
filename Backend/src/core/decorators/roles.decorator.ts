import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../../common/constants';
import { UserRole } from '../../modules/user/schemas/user.schema';

export const Roles = (...roles: UserRole[]): CustomDecorator<string> => SetMetadata(ROLES_KEY, roles);
