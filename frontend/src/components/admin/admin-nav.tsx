'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navegación entre las pantallas de administración.
 *
 * Va aquí y no en el menú lateral: ese menú es de HERRAMIENTAS, y meterle las
 * secciones internas de administración mezcla dos cosas distintas y lo alarga
 * cada vez que crece el panel.
 */
const TABS = [
  { href: '/admin', label: 'Cuentas' },
  { href: '/admin/conocimiento', label: 'Base de conocimiento' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    /**
     * La línea inferior la forman los propios enlaces, no un borde del `nav`.
     *
     * Antes el enlace activo llevaba `-mb-px` para montarse sobre el borde
     * del contenedor. Ese píxel desbordaba el `<ul>` por abajo, y como el
     * `<ul>` tiene `overflow-x-auto`, el navegador convierte el eje vertical
     * en `auto` también: aparecía una barra de desplazamiento vertical por UN
     * píxel. Sin márgenes negativos no hay desborde y no hay barra.
     */
    <nav aria-label="Administración">
      <ul className="flex overflow-x-auto">
        {TABS.map((tab) => {
          // Coincidencia exacta: sin esto «/admin» quedaría activo también
          // estando en «/admin/conocimiento».
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border-dorado text-dorado'
                    : 'border-grafito/20 text-grafito-texto hover:border-grafito/50 hover:text-marfil'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
        {/* Continúa la línea hasta el borde: sin esto se corta donde acaba
            la última pestaña y parece un subrayado a medias. */}
        <li aria-hidden className="flex-1 border-b-2 border-grafito/20" />
      </ul>
    </nav>
  );
}
