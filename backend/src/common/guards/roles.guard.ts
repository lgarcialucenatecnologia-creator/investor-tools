import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';
import { UserRole } from '../../modules/users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();

    // 403 y no 401: la sesión es válida, lo que falta es permiso. Un 401 haría
    // que el cliente borrara la sesión y mandara al login a alguien que ya
    // está dentro, produciendo un bucle.
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('No tienes permiso para ver esta sección.');
    }
    return true;
  }
}
