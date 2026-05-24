import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExpressRequest } from './auth.guard';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'You need to be authenticated to access this resource.',
      );
    }

    const requiredRoles =
      this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler()) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException(
        'You do not have the necessary permissions.',
      );
    }

    return true;
  }
}
