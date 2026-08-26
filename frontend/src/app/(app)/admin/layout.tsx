import type { ReactNode } from 'react';
import { requireRole } from '@/lib/session/server';

/**
 * Anida bajo `(app)`, así que la sesión ya está resuelta y la cabecera
 * puesta: aquí solo se añade la exigencia de rol.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole('/admin', 'admin');
  return <>{children}</>;
}
