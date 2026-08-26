import { NextRequest } from 'next/server';
import { exchangeForSession } from '@/lib/session/handlers';

/** Crea la contraseña de una cuenta pendiente y deja al usuario dentro. */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => ({}));
  return exchangeForSession(
    '/auth/set-initial-password',
    body,
    request.headers.get('user-agent'),
  );
}
