import { NextRequest, NextResponse } from 'next/server';
import { renewSession } from '@/lib/session/renew';

/**
 * Renueva la sesión y vuelve a donde el usuario iba.
 *
 * Existe como redirección y no solo como POST porque un componente de
 * servidor no puede escribir cookies mientras renderiza: si al pintar
 * `/dashboard` el access ya venció, la única salida es mandar aquí, renovar,
 * y volver.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next');
  // Solo rutas internas: sin esto, `?next=https://otro-sitio` convertiría
  // esta ruta en un trampolín para llevar usuarios a cualquier parte.
  const target =
    next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  const accessToken = await renewSession();
  return NextResponse.redirect(
    new URL(accessToken ? target : '/login', request.url),
  );
}

/** Para el cliente, que prefiere una respuesta a una redirección. */
export async function POST() {
  const accessToken = await renewSession();
  return NextResponse.json({ ok: Boolean(accessToken) }, {
    status: accessToken ? 200 : 401,
  });
}
