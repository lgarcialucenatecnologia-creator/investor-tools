'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, Settings2 } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { TOOLS } from '@/lib/tools';
import { BrandMark, initialsOf } from './brand-mark';

const ITEMS = [
  {
    href: '/dashboard',
    label: 'Inicio',
    tagline: 'Tu panorama',
    icon: LayoutDashboard,
  },
  ...TOOLS.map((tool) => ({
    href: `/dashboard/${tool.slug}`,
    label: tool.name,
    tagline: tool.tagline,
    icon: tool.icon,
  })),
];

export function isActive(pathname: string, href: string) {
  return href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);
}

/** Solo escritorio: en pantalla angosta la navegación vive en `MobileBar`. */
export function Sidebar() {
  const { user, logout } = useSession();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Herramientas"
      className="hidden shrink-0 flex-col border-r border-marfil/[0.06] bg-obsidiana/50 backdrop-blur-xl lg:flex lg:h-full lg:w-[17.5rem]"
    >
      <Link href="/dashboard" className="px-6 pt-7 pb-8">
        <BrandMark />
      </Link>

      <p className="px-6 pb-2 text-[0.68rem] uppercase tracking-[0.22em] text-grafito-texto">
        Herramientas
      </p>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-marfil/[0.06] text-marfil'
                    : 'text-marfil/65 hover:bg-marfil/[0.04] hover:text-marfil'
                }`}
              >
                {/* Indicador activo: un filo dorado, no un bloque de color. */}
                <span
                  aria-hidden="true"
                  className={`absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-full bg-dorado transition-opacity ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg border transition-colors ${
                    active
                      ? 'border-dorado/40 bg-dorado/10 text-dorado'
                      : 'border-marfil/[0.07] bg-marfil/[0.03] text-marfil/60 group-hover:text-marfil'
                  }`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{item.label}</span>
                  <span className="block truncate text-xs text-grafito-texto">
                    {item.tagline}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex shrink-0 flex-col gap-2 p-3">
        {user.role === 'admin' && (
          <Link
            href="/admin"
            aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-marfil/[0.06] text-dorado'
                : 'text-dorado/80 hover:bg-marfil/[0.04] hover:text-dorado'
            }`}
          >
            <Settings2 size={16} />
            Administración
          </Link>
        )}

        <div className="surface flex items-center gap-3 rounded-2xl p-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-nocturno to-azul text-xs font-medium text-marfil ring-1 ring-marfil/15"
          >
            {initialsOf(user.fullName ?? '', user.email)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-marfil">
              {user.fullName || user.email.split('@')[0]}
            </span>
            <span className="block truncate text-xs text-grafito-texto">
              {user.email}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-grafito-texto transition-colors hover:bg-marfil/[0.06] hover:text-marfil"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}
