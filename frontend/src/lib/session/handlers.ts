import 'server-only';
import { NextResponse } from 'next/server';
import { ApiError } from '../api/errors';
import type { AuthResult } from '../api/types';
import { callApi } from './upstream';
import { writeSessionCookies } from './cookies';

/**
 * Convierte cualquier fallo en una respuesta con la misma forma que las del
 * backend, para que el cliente tenga un único formato que interpretar.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message, code: error.code },
      { status: error.status },
    );
  }
  // Un fallo de red hacia NestJS no es culpa de quien está usando la app.
  return NextResponse.json(
    { message: 'No pudimos conectarnos. Vuelve a intentarlo en un momento.' },
    { status: 503 },
  );
}

/**
 * Llama a una ruta del backend que devuelve una sesión, guarda los tokens en
 * cookies y responde al navegador solo con el usuario. Los tokens no salen
 * de aquí.
 */
export async function exchangeForSession(
  path: string,
  payload: unknown,
  userAgent: string | null,
): Promise<NextResponse> {
  try {
    const result = await callApi<AuthResult>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: userAgent ? { 'User-Agent': userAgent } : {},
    });
    await writeSessionCookies(result);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    return errorResponse(error);
  }
}
