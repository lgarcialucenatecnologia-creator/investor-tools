import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api/errors';
import { readSessionCookies } from '@/lib/session/cookies';
import { errorResponse } from '@/lib/session/handlers';
import { renewSession } from '@/lib/session/renew';
import { callApi } from '@/lib/session/upstream';

/**
 * Puente para las llamadas del navegador que necesitan sesión.
 *
 * El cliente pide `/api/bff/users?...` y aquí se le añade el token que él
 * nunca ve. Si el access venció, se renueva una sola vez y se reintenta:
 * desde el punto de vista de quien usa la app, no pasó nada.
 */
const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as const;

async function forward(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const method = request.method.toUpperCase();
  if (!METHODS.includes(method as (typeof METHODS)[number])) {
    return NextResponse.json({ message: 'Método no permitido.' }, { status: 405 });
  }

  const search = request.nextUrl.search;
  const target = `/${path.join('/')}${search}`;
  const body =
    method === 'GET' || method === 'DELETE' ? undefined : await request.text();

  const attempt = async (accessToken: string | null) =>
    callApi<unknown>(target, { method, body, accessToken });

  const { accessToken } = await readSessionCookies();

  try {
    return NextResponse.json((await attempt(accessToken)) ?? null);
  } catch (error) {
    // 401 es token vencido: se renueva y se reintenta. Un 403 NO se
    // reintenta — ahí el token está bien y lo que falta es permiso, así que
    // renovar solo daría otra vuelta al mismo muro.
    if (!(error instanceof ApiError) || error.status !== 401) {
      return errorResponse(error);
    }

    // Se renueva en este mismo proceso, no llamando por HTTP a la ruta de
    // renovación: así el token nuevo está disponible para el reintento y las
    // cookies salen en esta misma respuesta.
    const fresh = await renewSession();
    if (!fresh) return errorResponse(error);

    try {
      return NextResponse.json((await attempt(fresh)) ?? null);
    } catch (retryError) {
      return errorResponse(retryError);
    }
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return forward(request, (await context.params).path);
}
export const POST = GET;
export const PATCH = GET;
export const PUT = GET;
export const DELETE = GET;
