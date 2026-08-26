import { UserRole } from '../../modules/users/schemas/user.schema';

/** Lo que `JwtStrategy.validate()` adjunta a `request.user`. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  /** Sesión (dispositivo) con la que se autenticó esta petición. */
  sessionId: string;
}

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  email: string;
  /** Identificador de la sesión, para poder rotar y cerrar solo esa. */
  sid: string;
  /**
   * Para qué sirve este token. Los dos llevaban exactamente el mismo
   * contenido, así que lo único que impedía usar un refresh de 7 días como
   * token de acceso era que los secretos difirieran. Ahora también se
   * comprueba el tipo: son dos barreras, no una.
   */
  typ: TokenType;
  /**
   * Identificador único del token. Sin esto, dos refrescos dentro del mismo
   * segundo generan un JWT byte a byte idéntico —la marca de tiempo va en
   * segundos— y la rotación se vuelve una operación vacía.
   */
  jti?: string;
}
