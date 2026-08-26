'use client';

import { useContext } from 'react';
import { SessionContext, type SessionValue } from '@/components/session/session-provider';

/** Solo se puede usar dentro de una ruta protegida, donde siempre hay sesión. */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error(
      'useSession solo funciona dentro de SessionProvider, es decir en una ruta con sesión.',
    );
  }
  return value;
}
