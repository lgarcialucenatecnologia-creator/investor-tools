import 'server-only';
import { redirect } from 'next/navigation';
import { ApiError } from '../api/errors';
import type { SessionUser, UserRole } from '../api/types';
import { readSessionCookies } from './cookies';
import { callApi } from './upstream';

/**
 * Por qué no hay sesión utilizable. La distinción importa:
 *
 * - `expired` es un problema del token y se arregla renovando.
 * - `blocked` es un problema de la cuenta —suspendida, vencida, pendiente de
 *   activar— y renovar no lo arregla: hay que decirle a la persona qué pasa.
 *
 * Tratarlos igual produce un rebote inútil por la ruta de renovación y deja
 * al usuario en el acceso sin ninguna explicación.
 */
export type SessionResult =
  | { status: 'ok'; user: SessionUser }
  | { status: 'none' }
  | { status: 'expired' }
  | { status: 'blocked'; code?: string };

/**
 * Quién está usando la aplicación, según el backend.
 *
 * Se pregunta al API en vez de leer el contenido del token porque el backend
 * revalida en cada petición: una cuenta suspendida, vencida o con la
 * contraseña recién cambiada tiene que perder el acceso al instante, y eso
 * un token firmado hace diez minutos no lo sabe.
 */
export async function resolveSession(): Promise<SessionResult> {
  const { accessToken, refreshToken } = await readSessionCookies();
  if (!accessToken) return refreshToken ? { status: 'expired' } : { status: 'none' };

  try {
    const user = await callApi<SessionUser>('/auth/me', { accessToken });
    return { status: 'ok', user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { status: 'blocked', code: error.code };
    }
    return refreshToken ? { status: 'expired' } : { status: 'none' };
  }
}

/** Atajo para cuando solo importa si hay alguien. */
export async function getSession(): Promise<SessionUser | null> {
  const result = await resolveSession();
  return result.status === 'ok' ? result.user : null;
}

/**
 * Exige sesión. Si el access venció pero queda refresh, pasa por la ruta de
 * renovación y vuelve: un componente de servidor no puede escribir cookies
 * mientras renderiza, así que la renovación tiene que ocurrir en una
 * redirección.
 */
export async function requireSession(returnTo: string): Promise<SessionUser> {
  const result = await resolveSession();

  if (result.status === 'ok') return result.user;

  if (result.status === 'expired') {
    redirect(`/api/session/refresh?next=${encodeURIComponent(returnTo)}`);
  }

  // Cuenta bloqueada: se lleva el motivo al acceso para poder explicarlo, en
  // vez de dejar a la persona frente a un formulario sin saber qué pasó.
  if (result.status === 'blocked') {
    redirect(`/login?reason=${result.code ?? 'blocked'}`);
  }

  redirect('/login');
}

/**
 * Exige un rol. Quien tiene sesión pero no permiso NO va al acceso —ya está
 * dentro— sino a su propia página: mandarlo al acceso produciría un bucle,
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
