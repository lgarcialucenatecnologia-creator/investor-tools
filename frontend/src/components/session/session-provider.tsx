'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useMemo, type ReactNode } from 'react';
import type { SessionUser } from '@/lib/api/types';

export interface SessionValue {
  user: SessionUser;
  logout: () => Promise<void>;
}

export const SessionContext = createContext<SessionValue | null>(null);

/**
 * Recibe el usuario ya resuelto por el layout de servidor.
 *
 * Por eso no hay estado de «cargando» ni pantalla intermedia: el primer
 * fotograma ya sabe quién eres. El patrón habitual —pedir el usuario desde
 * el cliente al montar— cuesta una vuelta al servidor y un parpadeo en cada
 * ruta protegida.
 */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch('/api/session/logout', { method: 'POST' });
    // `refresh()` además de navegar: sin él, los componentes de servidor ya
    // renderizados se quedarían en caché con la sesión anterior.
    router.replace('/login');
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, logout }), [user, logout]);
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
