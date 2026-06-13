import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/constants';
import { UserRole } from '../../modules/user/schemas/user.schema';
import { UserRepository } from '../../modules/user/user.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId: string = request.userId;

    if (!userId) {
      throw new ForbiddenException('Access denied');
    }

    const user = await this.userRepository.findUserById(userId);

    if (!user || !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
