import 'server-only';
import { cookies } from 'next/headers';
import { env } from '../env';

/**
 * La sesión vive en cookies que el navegador no puede leer.
 *
 * La alternativa habitual, guardar los tokens en `localStorage`, deja un
 * refresh de siete días al alcance de cualquier script inyectado en la
 * página — y con rotación activada es peor todavía: si el atacante refresca
 * primero, el sistema toma a la víctima por el ladrón y la expulsa.
 *
 * Las pone el propio servidor de Next, no NestJS, y por una razón que solo
 * se ve en producción: si el frontend queda en un dominio y el API en otro,
 * la cookie tendría que ser `SameSite=None` y Safari la descartaría. Puesta
 * en el origen de Next siempre es de primera parte.
 */
const ACCESS = 'lf_at';
const REFRESH = 'lf_rt';

/** El access vive 15 minutos; se le da un poco más de margen. */
const ACCESS_MAX_AGE = 20 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const base = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  // A '/' y no a '/api': los componentes de servidor que rendericen el
  // panel necesitan verlas al pintar la página, no solo al llamar al API.
  path: '/',
};

export async function readSessionCookies() {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS)?.value ?? null,
    refreshToken: jar.get(REFRESH)?.value ?? null,
  };
}

export async function writeSessionCookies(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS, tokens.accessToken, { ...base, maxAge: ACCESS_MAX_AGE });
  jar.set(REFRESH, tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete({ ...base, name: ACCESS });
  jar.delete({ ...base, name: REFRESH });
}

export const SESSION_COOKIE_NAMES = { ACCESS, REFRESH } as const;
