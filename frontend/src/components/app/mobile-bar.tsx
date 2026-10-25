'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { TOOLS } from '@/lib/tools';
import { BrandMark } from './brand-mark';
import { isActive } from './sidebar';

const ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  ...TOOLS.map((tool) => ({
    href: `/dashboard/${tool.slug}`,
    label: tool.name,
    icon: tool.icon,
  })),
];

/**
 * Solo en pantalla angosta: marca arriba y las herramientas como píldoras que
 * se deslizan. Un cajón desplegable sería más máquina para el mismo resultado.
 */
export function MobileBar() {
  const { user, logout } = useSession();
  const pathname = usePathname();

  return (
    <div className="shrink-0 border-b border-marfil/[0.06] bg-obsidiana/60 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
        <Link href="/dashboard">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <Link href="/admin" className="text-sm text-dorado">
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Cerrar sesión"
            className="grid size-9 place-items-center rounded-lg border border-marfil/10 text-grafito-texto"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <nav aria-label="Herramientas">
        <ul className="flex gap-2 overflow-x-auto px-5 pb-3">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition-colors ${
                    active
                      ? 'border-dorado/50 bg-dorado/10 text-dorado'
                      : 'border-marfil/10 text-marfil/70'
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
