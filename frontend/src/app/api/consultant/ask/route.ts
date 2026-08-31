import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { readSessionCookies } from '@/lib/session/cookies';
import { renewSession } from '@/lib/session/renew';

/**
 * Pregunta al Consultor, con la respuesta llegando a trozos.
 *
 * Va por su propia ruta y no por el puente general porque aquél lee la
 * respuesta entera con `response.json()`: con eso la transmisión se pierde y
 * el texto aparece de golpe al final, que es justo lo que se quería evitar.
 *
 * Aquí el flujo se reenvía tal cual, sin tocarlo.
 */
export const maxDuration = 300;

async function forward(request: NextRequest, body: string, token: string | null) {
  return fetch(`${env.apiUrl}/consultant/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    cache: 'no-store',
  });
}

export async function POST(request: NextRequest) {
  // Se lee una vez y se guarda: si hay que reintentar con el token renovado,
  // el cuerpo original ya no se puede volver a leer del flujo entrante.
  const body = await request.text();
  const { accessToken } = await readSessionCookies();

  let upstream = await forward(request, body, accessToken);

  if (upstream.status === 401) {
    const fresh = await renewSession();
    if (fresh) upstream = await forward(request, body, fresh);
  }

  if (!upstream.ok || !upstream.body) {
    const detail: unknown = await upstream.json().catch(() => null);
    const message =
      detail && typeof detail === 'object' && 'message' in detail
        ? String((detail as { message: unknown }).message)
        : 'No pude conectar con el Consultor.';
    return NextResponse.json({ message }, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
