import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/schemas/user.schema';

export const ROLES_KEY = 'roles';

/**
 * Restringe una ruta —o un controlador entero— a ciertos roles.
 * Se apoya en `JwtAuthGuard`, que ya es global: sin sesión no se llega acá.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
