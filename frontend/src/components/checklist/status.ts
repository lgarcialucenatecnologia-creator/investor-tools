import type { ChecklistStatus } from '@/lib/api/types';

/** Tono de cada estado: dorado a favor, oro con reservas, alerta en contra. */
export const STATUS_CHIP: Record<ChecklistStatus, string> = {
  solido: 'border-dorado/40 bg-dorado/10 text-dorado',
  revisar: 'border-oro/40 bg-oro/10 text-oro',
  debil: 'border-alerta/40 bg-alerta/10 text-alerta',
  no_pasa: 'border-alerta/40 bg-alerta/10 text-alerta',
  incompleto: 'border-grafito/40 text-grafito-texto',
  sin_evaluar: 'border-grafito/40 text-grafito-texto',
};

export const sectionAnchor = (sectionId: string) => `criterio-${sectionId}`;
