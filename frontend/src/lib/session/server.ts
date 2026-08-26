import 'server-only';
import { redirect } from 'next/navigation';
import type { SessionUser, UserRole } from '../api/types';
import { readSessionCookies } from './cookies';
import { callApi } from './upstream';

/**
 * Quién está usando la aplicación, según el backend.
 *
 * Se pregunta al API en vez de leer el contenido del token porque el backend
 * revalida en cada petición: una cuenta suspendida, vencida o con la
 * contraseña recién cambiada tiene que perder el acceso al instante, y eso
 * un token firmado hace diez minutos no lo sabe.
 */
export async function getSession(): Promise<SessionUser | null> {
  const { accessToken } = await readSessionCookies();
  if (!accessToken) return null;
  return callApi<SessionUser>('/auth/me', { accessToken }).catch(() => null);
}

/**
 * Exige sesión. Si el access venció pero queda refresh, pasa por la ruta de
 * renovación y vuelve: un componente de servidor no puede escribir cookies
 * mientras renderiza, así que la renovación tiene que ocurrir en una
 * redirección.
 */
export async function requireSession(returnTo: string): Promise<SessionUser> {
  const { accessToken, refreshToken } = await readSessionCookies();

  if (!accessToken && refreshToken) {
    redirect(`/api/session/refresh?next=${encodeURIComponent(returnTo)}`);
  }

  const user = await getSession();
  if (!user) {
    if (refreshToken) {
      redirect(`/api/session/refresh?next=${encodeURIComponent(returnTo)}`);
    }
    redirect('/login');
  }
  return user;
}

/**
 * Exige un rol. Quien tiene sesión pero no permiso NO va al login —ya está
 * dentro— sino a su propia página: mandarlo al login produciría un bucle,
 * porque entraría bien y volvería a chocar contra lo mismo.
 */
export async function requireRole(
  returnTo: string,
  ...roles: UserRole[]
): Promise<SessionUser> {
  const user = await requireSession(returnTo);
  if (!roles.includes(user.role)) redirect('/dashboard');
  return user;
}
