import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { SessionProvider } from '@/components/session/session-provider';
import { requireSession } from '@/lib/session/server';

/**
 * Aquí está la autorización de verdad. El `proxy.ts` solo mira si existe la
 * cookie, que es barato pero no dice nada: una cookie existe aunque la
 * cuenta esté suspendida o vencida. Este layout se lo pregunta al backend.
 *
 * El usuario resuelto baja al cliente por el proveedor, así que las páginas
 * de dentro no vuelven a pedirlo ni muestran un intermedio de carga.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireSession('/dashboard');

  return (
    <SessionProvider user={user}>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
