import { NextRequest, NextResponse } from 'next/server';

/**
 * Comprobación optimista y barata: si no hay ninguna cookie de sesión, no
 * vale la pena renderizar una página protegida para acabar redirigiendo.
 *
 * Es una conveniencia, NO la autorización. La de verdad la hacen los layouts
 * de servidor preguntándole al backend quién eres: aquí solo se mira que la
 * cookie exista, y una cookie existe aunque su token esté vencido o
 * pertenezca a una cuenta suspendida.
 *
 * En Next 16 este archivo se llama `proxy.ts`; `middleware.ts` quedó atrás.
 */
const PROTECTED = ['/dashboard', '/admin'];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has('lf_at') || request.cookies.has('lf_rt');

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  // Con sesión no se pasa por el acceso: se va derecho al panel.
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
