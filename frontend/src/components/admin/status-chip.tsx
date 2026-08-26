import type { UserStatus } from '@/lib/api/types';

/**
 * El estado se lee de un vistazo por forma y color, no solo por texto: en
 * una tabla larga, buscar quién falta por activar no debería exigir leer.
 */
const STYLES: Record<UserStatus, { label: string; className: string }> = {
  active: {
    label: 'Activo',
    className: 'border-dorado/40 bg-dorado/10 text-dorado',
  },
  pending_activation: {
    label: 'Sin activar',
    className: 'border-azul/60 bg-azul/20 text-marfil',
  },
  suspended: {
    label: 'Pausado',
    className: 'border-alerta/40 bg-alerta/10 text-alerta',
  },
};

export function StatusChip({ status }: { status: UserStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs ${style.className}`}
    >
      {style.label}
    </span>
  );
}
