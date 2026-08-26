'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useSession } from '@/hooks/use-session';

export function AppHeader() {
  const { user, logout } = useSession();

  return (
    <header className="border-b border-grafito/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link
          href="/dashboard"
          className="font-display text-lg tracking-tight text-marfil"
        >
          Pensionate con Bienes Raíces
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="text-dorado underline-offset-4 hover:underline"
            >
              Administración
            </Link>
          )}
          <span className="hidden text-grafito-texto sm:inline">
            {user.email}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 rounded-md border border-grafito/40 px-3 py-1.5 text-grafito-texto transition-colors hover:border-dorado hover:text-dorado"
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
