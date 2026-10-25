'use client';

import { useId, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { ChecklistItem } from '@/lib/api/types';

const RATINGS = [1, 2, 3, 4, 5] as const;

/** Largo máximo de una observación; el backend recorta en el mismo punto. */
const MAX_NOTE_LENGTH = 1000;

/**
 * Un punto del checklist: su calificación de 1 a 5, la guía y las
 * observaciones.
 *
 * Volver a pulsar la nota elegida la quita. Calificar es lo que suma
 * cobertura, así que tiene que poder deshacerse si se marcó sin saber.
 */
export function ItemCard({
  item,
  rating,
  note,
  onRate,
  onNote,
}: {
  item: ChecklistItem;
  rating: number | undefined;
  note: string;
  onRate: (value: number | undefined) => void;
  onNote: (value: string) => void;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const guideId = useId();
  const noteId = useId();
  const failsKnockout = Boolean(item.knockout) && rating !== undefined && rating <= 2;

  return (
    <article className="rounded-lg border border-grafito/20 bg-obsidiana/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-marfil">
            {item.title}
            {item.knockout && (
              <span className="ml-2 whitespace-nowrap rounded border border-alerta/50 px-1.5 py-0.5 align-middle text-xs text-alerta">
                eliminatorio
              </span>
            )}
          </h3>
          <p className="mt-1 text-xs text-grafito-texto">Peso {item.weight}%</p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide((open) => !open)}
          aria-expanded={showGuide}
          aria-controls={guideId}
          className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
            showGuide
              ? 'border-dorado/60 text-dorado'
              : 'border-grafito/30 text-grafito-texto hover:border-grafito/60 hover:text-marfil'
          }`}
        >
          <HelpCircle size={14} />
          Guía
        </button>
      </div>

      {showGuide && (
        <div
          id={guideId}
          className="mt-4 rounded-md border border-grafito/20 bg-nocturno px-4 py-3 text-sm leading-relaxed text-marfil/75"
        >
          <p>{item.guide}</p>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-grafito-texto">1 · juega en contra</dt>
              <dd className="mt-0.5 text-marfil/70">{item.scale.low}</dd>
            </div>
            <div>
              <dt className="text-grafito-texto">5 · juega a favor</dt>
              <dd className="mt-0.5 text-marfil/70">{item.scale.high}</dd>
            </div>
          </dl>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={`Calificación de ${item.title}`}
        className="mt-4 flex flex-wrap items-center gap-2"
      >
        {RATINGS.map((value) => {
          const selected = rating === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${value} de 5${value === 1 ? ` — ${item.scale.low}` : value === 5 ? ` — ${item.scale.high}` : ''}`}
              onClick={() => onRate(selected ? undefined : value)}
              className={`grid size-10 place-items-center rounded-full border text-sm tabular-nums transition-colors ${
                selected
                  ? failsKnockout
                    ? 'border-alerta bg-alerta/15 text-alerta'
                    : 'border-dorado bg-dorado/15 text-dorado'
                  : 'border-grafito/30 text-marfil/70 hover:border-grafito/60 hover:text-marfil'
              }`}
            >
              {value}
            </button>
          );
        })}
        <span className="ml-1 text-xs text-grafito-texto">
          {rating === undefined ? 'Sin calificar' : `Calificado: ${rating} de 5`}
        </span>
      </div>

      {failsKnockout && (
        <p className="mt-3 text-sm text-alerta">
          Este punto es eliminatorio: con esta calificación el proyecto no pasa.
        </p>
      )}

      <label htmlFor={noteId} className="sr-only">
        Observaciones sobre {item.title}
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(event) => onNote(event.target.value)}
        maxLength={MAX_NOTE_LENGTH}
        rows={2}
        placeholder="Observaciones, dudas o evidencia del proyecto…"
        className="mt-4 w-full resize-y rounded-lg border border-input bg-input/30 px-3 py-2 text-sm text-marfil outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </article>
  );
}
