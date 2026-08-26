import { UserRole } from '../../modules/users/schemas/user.schema';

/** Lo que `JwtStrategy.validate()` adjunta a `request.user`. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
