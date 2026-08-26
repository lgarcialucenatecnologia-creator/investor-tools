import 'server-only';
import { env } from '../env';
import { toApiError } from '../api/errors';

/**
 * Cliente hacia NestJS. Solo corre en el servidor de Next: es el único que
 * conoce la dirección del API y el único que toca los tokens.
 */
export async function callApi<T>(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = init;

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    // La sesión la resuelve cada petición: nada de esto se cachea.
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, body);
  return body as T;
}
