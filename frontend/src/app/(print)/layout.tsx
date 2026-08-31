import type { ReactNode } from 'react';
import { requireSession } from '@/lib/session/server';

/**
 * Documentos para imprimir o guardar como PDF.
 *
 * Fuera del layout de la aplicación a propósito: sin menú lateral, sin
 * cabecera, sin nada que sobre en una hoja. Pero con la misma exigencia de
 * sesión — un análisis es información del patrimonio de alguien.
 */
export default async function PrintLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSession('/dashboard');
  return <div className="doc">{children}</div>;
}
