'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Settings2 } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { TOOLS } from '@/lib/tools';

export function Sidebar() {
  const { user, logout } = useSession();
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Inicio', tagline: 'Dónde estás parado' },
    ...TOOLS.map((tool) => ({
      href: `/dashboard/${tool.slug}`,
      label: tool.name,
      tagline: tool.tagline,
    })),
  ];

  return (
    <nav
      aria-label="Herramientas"
      className="flex shrink-0 flex-col border-b border-grafito/20 bg-nocturno lg:h-screen lg:w-[17rem] lg:border-b-0 lg:border-r"
    >
      <Link
        href="/dashboard"
        className="hidden px-6 py-7 font-display text-lg leading-tight tracking-tight text-marfil lg:block"
      >
        Pensionate con
        <br />
        Bienes Raíces
      </Link>

      {/* En pantalla angosta el menú se vuelve una fila que se desliza: un
          cajón desplegable sería más máquina para el mismo resultado. */}
      <ul className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:py-0">
        {items.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-md px-4 py-3 transition-colors lg:whitespace-normal ${
                  active
                    ? 'bg-obsidiana text-marfil'
                    : 'text-marfil/70 hover:bg-obsidiana/60 hover:text-marfil'
                }`}
              >
                <span className="text-sm">{item.label}</span>
                <span className="mt-0.5 hidden text-xs text-grafito-texto lg:block">
                  {item.tagline}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden flex-col gap-1 border-t border-grafito/20 p-3 lg:flex">
        {user.role === 'admin' && (
          <Link
            href="/admin"
            aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-obsidiana text-dorado'
                : 'text-dorado/80 hover:bg-obsidiana/60 hover:text-dorado'
            }`}
          >
            <Settings2 size={15} />
            Administración
          </Link>
        )}

        <p className="truncate px-4 pt-2 text-xs text-grafito-texto">
          {user.email}
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-grafito-texto transition-colors hover:bg-obsidiana/60 hover:text-marfil"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
