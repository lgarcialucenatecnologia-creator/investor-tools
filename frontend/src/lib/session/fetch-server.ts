import 'server-only';
import { readSessionCookies } from './cookies';
import { renewSession } from './renew';
import { callApi } from './upstream';
import { ApiError } from '../api/errors';

/**
 * Llama al API desde un componente de servidor, con la sesión puesta.
 *
 * Si el token venció, renueva y reintenta una vez. Es el mismo trato que da
 * el puente a las llamadas del navegador: quien está usando la aplicación no
 * tiene por qué enterarse de que un token duró quince minutos.
 */
export async function fetchWithSession<T>(path: string): Promise<T> {
  const { accessToken } = await readSessionCookies();

  try {
    return await callApi<T>(path, { accessToken });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const fresh = await renewSession();
    if (!fresh) throw error;
    return callApi<T>(path, { accessToken: fresh });
  }
}
