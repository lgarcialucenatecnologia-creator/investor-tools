import type { ReactNode } from 'react';
import { MobileBar } from '@/components/app/mobile-bar';
import { Sidebar } from '@/components/app/sidebar';
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
      {/*
        El panel se saca del flujo con `fixed inset-0`, no se le da una
        altura. La diferencia importa: con una altura, basta que CUALQUIER
        otra cosa del documento ocupe espacio para que la página crezca y
        aparezca una segunda barra de desplazamiento — y Next reparte el
        contenido en bloques temporales antes de colocarlo en su sitio.
        Fuera del flujo, nada de eso puede empujar nada.

        La clase `app-shell` es el ancla de la regla de globals.css que
        además impide que el documento se desplace mientras el panel esté
        montado. Dos candados en vez de uno, porque este defecto ya volvió
        dos veces.
      */}
      <div className="app-shell fixed inset-0 flex flex-col overflow-hidden lg:flex-row">
        <MobileBar />
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 lg:px-12 lg:py-14">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
