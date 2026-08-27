import type { Verdict } from '@/lib/api/types';

const TONE: Record<Verdict, { ring: string; text: string; fill: string }> = {
  verde: { ring: 'var(--color-dorado)', text: 'text-dorado', fill: 'bg-dorado/10' },
  amarillo: { ring: 'var(--color-oro)', text: 'text-oro', fill: 'bg-oro/10' },
  rojo: { ring: 'var(--color-alerta)', text: 'text-alerta', fill: 'bg-alerta/10' },
  sin_datos: {
    ring: 'var(--color-grafito)',
    text: 'text-grafito-texto',
    fill: 'bg-nocturno',
  },
};

/**
 * El score y la confianza, juntos y del mismo tamaño.
 *
 * Van juntos a propósito: un 85 con 40% de confianza no es un 85, y separar
 * los dos números invitaría a leer solo el primero.
 */
export function ScoreDial({
  score,
  confidence,
  verdict,
}: {
  score: number | null;
  confidence: number;
  verdict: Verdict;
}) {
  const tone = TONE[verdict];
  const shown = verdict === 'sin_datos' ? null : score;
  const angle = ((shown ?? 0) / 100) * 360;

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative grid size-28 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${tone.ring} ${angle}deg, rgb(116 112 120 / 22%) ${angle}deg)`,
        }}
        role="img"
        aria-label={
          shown === null
            ? 'Sin puntaje: faltan datos'
            : `Puntaje ${shown} de 100`
        }
      >
        <div className="grid size-[6.25rem] place-items-center rounded-full bg-obsidiana">
          <span className={`font-display text-3xl tabular-nums ${tone.text}`}>
            {shown ?? '—'}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Confianza del resultado
        </p>
        <p className="mt-2 font-display text-3xl tabular-nums text-marfil">
          {confidence}%
        </p>
        <div className="mt-3 h-1.5 w-40 overflow-hidden rounded bg-grafito/25">
          <span
            className="block h-full rounded bg-marfil/70"
            style={{ width: `${confidence}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-grafito-texto">
          {confidence < 60
            ? 'Faltan respuestas para poder concluir.'
            : 'Suficiente para dar un veredicto.'}
        </p>
      </div>
    </div>
  );
}
