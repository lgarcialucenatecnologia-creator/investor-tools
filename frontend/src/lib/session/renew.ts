import 'server-only';
import type { AuthResult } from '../api/types';
import {
  clearSessionCookies,
  readSessionCookies,
  writeSessionCookies,
} from './cookies';
import { callApi } from './upstream';

/**
 * Renueva la sesión en el proceso actual y devuelve el nuevo token.
 *
 * Vive aparte de la ruta a propósito. Renovar llamando por HTTP a la propia
 * ruta no sirve para reintentar dentro de la misma petición: las cookies
 * nuevas quedarían en esa respuesta interna, mientras que `cookies()` sigue
 * viendo las que llegaron. El reintento usaría el token vencido.
 */
export async function renewSession(): Promise<string | null> {
  const { refreshToken } = await readSessionCookies();
  if (!refreshToken) return null;

  try {
    const tokens = await callApi<AuthResult>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    await writeSessionCookies(tokens);
    return tokens.accessToken;
  } catch {
    // El refresh no vale: la sesión terminó de verdad.
    await clearSessionCookies();
    return null;
  }
}
