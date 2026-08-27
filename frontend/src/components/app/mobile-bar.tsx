'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';

/** Solo en pantalla angosta: en el escritorio esto vive en el lateral. */
export function MobileBar() {
  const { user, logout } = useSession();

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-grafito/20 px-5 py-4 lg:hidden">
      <Link href="/dashboard" className="font-display text-marfil">
        Pensionate con Bienes Raíces
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
          className="grid size-9 place-items-center rounded-md border border-grafito/40 text-grafito-texto"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
