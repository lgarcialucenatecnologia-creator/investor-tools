import { NextResponse } from 'next/server';
import { clearSessionCookies, readSessionCookies } from '@/lib/session/cookies';
import { callApi } from '@/lib/session/upstream';

export async function POST() {
  const { accessToken } = await readSessionCookies();

  // Se avisa al backend para que cierre esa sesión, pero si falla se borran
  // las cookies igual: quien pidió salir tiene que quedar fuera.
  if (accessToken) {
    await callApi('/auth/logout', { method: 'POST', accessToken }).catch(
      () => undefined,
    );
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
