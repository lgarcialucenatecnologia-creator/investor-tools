import type { ReactNode } from 'react';

/**
 * Pantalla partida del acceso.
 *
 * El panel izquierdo continúa donde termina la Secuencia de Apertura: la
 * misma tesis con la que cierra la pieza. Quien llega aquí después de verla
 * reconoce la frase; quien llega directo por un enlace la lee por primera
 * vez. Se oculta por debajo de `lg` porque en un teléfono el formulario es
 * lo único que importa.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-nocturno p-12 lg:flex">
        <div className="auth-grid" aria-hidden="true" />

        <span className="relative font-display text-sm tracking-[0.18em] text-marfil">
          Pensionate con Bienes Raíces
        </span>

        <div className="relative max-w-md">
          <p className="text-xs uppercase tracking-[0.24em] text-dorado">
            Método Ganar al Comprar
          </p>
          <p className="mt-6 font-display text-3xl leading-snug text-marfil xl:text-4xl">
            La ganancia empieza en la compra.
          </p>
          <p className="mt-5 leading-relaxed text-marfil/70">
            No se gana vendiendo caro. Se gana entrando bien: en la lista 0,
            sobre planos, con el precio revisado contra lo que de verdad se
            está pagando en la zona.
          </p>
        </div>

        <p className="relative text-sm text-grafito-texto">
          Luis Fernando García Lucena
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
