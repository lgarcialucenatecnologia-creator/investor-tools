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
      {/* `h-dvh` y no `min-h-screen`: con el mínimo, el contenedor crece con
          el contenido y la página entera se desplaza, llevándose el menú.
          Fijando la altura a la ventana y ocultando su desbordamiento, lo
          único que se desplaza es el contenido. `dvh` en vez de `vh` porque
          en el móvil la barra del navegador aparece y desaparece. */}
      <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
        <MobileBar />
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 lg:px-12 lg:py-14">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
