'use client';

import { ApiError } from './errors';

/**
 * Cliente del navegador. Llama siempre al propio Next, nunca a NestJS: el
 * token lo añade el servidor, y así no existe en el navegador ningún valor
 * que robar.
 */
export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/bff/${path.replace(/^\//, '')}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const shape = (body ?? {}) as { message?: string; code?: string };
    throw new ApiError(
      response.status,
      shape.message ?? 'No pudimos completar la operación.',
      shape.code,
    );
  }
  return body as T;
}
