import type { ChatStep } from '@/lib/api/types';

/**
 * Lo que se está esperando, dicho con precisión.
 *
 * Los pasos NO son decorativos: los emite el backend según lo que de verdad
 * está haciendo, y cada uno se anuncia ANTES de esperarlo.
 *
 * Medido contra el servidor real: «material» 0,3 s · «preparando» 1,3 s
 * cuando toca · «pensando» unos 5 s, que es el modelo y es la espera de
 * verdad. El texto de «preparando» NO promete que las siguientes respuestas
 * sean más rápidas, porque no lo son: el caché ahorra dinero, no segundos.
 */
const LABELS: Record<ChatStep, { text: string; note?: string }> = {
  material: { text: 'Abriendo el método' },
  preparando: {
    text: 'Preparando el material del método',
    note: 'Esto no pasa en cada pregunta, solo de vez en cuando.',
  },
  pensando: { text: 'Armando la respuesta' },
};

export function Tracing({
  step,
  label,
}: {
  /** Cuando hay un paso concreto del Consultor. */
  step?: ChatStep;
  /** O una etiqueta suelta, para otras esperas. */
  label?: string;
}) {
  const copy = step ? LABELS[step] : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex max-w-md flex-col gap-2 px-2 py-1"
    >
      <div className="tracing rounded-full" />
      <p className="text-sm text-grafito-texto">
        {copy?.text ?? label ?? 'Un momento'}
      </p>
      {copy?.note && (
        <p className="text-xs text-grafito-texto/80">{copy.note}</p>
      )}
    </div>
  );
}
