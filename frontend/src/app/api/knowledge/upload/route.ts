import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { ApiError, toApiError } from '@/lib/api/errors';
import { readSessionCookies } from '@/lib/session/cookies';
import { errorResponse } from '@/lib/session/handlers';
import { renewSession } from '@/lib/session/renew';

/**
 * Subida del documento del Consultor.
 *
 * Va por su propia ruta y no por el puente general porque aquél lee el cuerpo
 * como texto y fuerza `application/json`: con eso un envío multiparte pierde
 * su frontera y llega ilegible al backend.
 *
 * Aquí el cuerpo se reenvía COMO FLUJO, sin leerlo. Preserva la cabecera
 * original con su frontera y evita cargar en memoria un PDF de decenas de
 * megabytes por cada subida simultánea.
 */
export const maxDuration = 300; // La transcripción tarda: son varias tandas.

async function forward(request: NextRequest, accessToken: string | null) {
  const response = await fetch(`${env.apiUrl}/knowledge`, {
    method: 'POST',
    headers: {
      'content-type':
        request.headers.get('content-type') ?? 'multipart/form-data',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: request.body,
    // Node exige declararlo cuando el cuerpo es un flujo que aún no terminó.
    duplex: 'half',
    cache: 'no-store',
  } as RequestInit & { duplex: 'half' });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, body);
  return body;
}

export async function POST(request: NextRequest) {
  const { accessToken } = await readSessionCookies();

  try {
    return NextResponse.json(await forward(request, accessToken));
  } catch (error) {
    // No se reintenta con un token renovado: el cuerpo es un flujo y ya se
    // consumió. Si el access venció, se pide de nuevo desde el navegador,
    // que todavía tiene el archivo.
    if (error instanceof ApiError && error.status === 401) {
      await renewSession();
      return NextResponse.json(
        {
          message:
            'Tu sesión se renovó. Vuelve a intentar la subida, el archivo sigue seleccionado.',
          code: 'RETRY_UPLOAD',
        },
        { status: 409 },
      );
    }
    return errorResponse(error);
  }
}
