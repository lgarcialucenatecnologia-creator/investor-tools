import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/session/handlers';
import { callApi } from '@/lib/session/upstream';

/** «Soy usuario nuevo»: ¿existe esta cuenta y sigue sin contraseña? */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => ({}));
  try {
    const result = await callApi<{ email: string; fullName: string }>(
      '/auth/check-new-user',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
