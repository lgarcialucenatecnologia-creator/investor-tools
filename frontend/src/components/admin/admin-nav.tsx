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
    <nav aria-label="Administración" className="border-b border-grafito/20">
      <ul className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          // Coincidencia exacta: sin esto «/admin» quedaría activo también
          // estando en «/admin/conocimiento».
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px block whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border-dorado text-dorado'
                    : 'border-transparent text-grafito-texto hover:text-marfil'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
