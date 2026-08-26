import { NextRequest } from 'next/server';
import { exchangeForSession } from '@/lib/session/handlers';

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => ({}));
  return exchangeForSession(
    '/auth/login',
    body,
    request.headers.get('user-agent'),
  );
}
