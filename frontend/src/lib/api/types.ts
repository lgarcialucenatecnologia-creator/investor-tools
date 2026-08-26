/** Contrato con el backend. Debe seguir a `UsersService.sanitize()`. */

export type UserRole = 'investor' | 'admin';
export type UserStatus = 'pending_activation' | 'active' | 'suspended';

/** Lo que devuelve `GET /api/auth/me`. */
export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

/** Lo que devuelven login y activación. */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; fullName: string; email: string; role: UserRole };
}

/** Ficha completa, tal como la entrega el panel de administración. */
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  accessExpiresAt: string | null;
  activationExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
