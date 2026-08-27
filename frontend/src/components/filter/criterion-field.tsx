'use client';

import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import type { Criterion } from '@/lib/api/types';

/**
 * Una pregunta con sus opciones y, siempre, «No sé todavía».
 *
 * Esa última opción no es un descuido ni una cortesía: es la respuesta más
 * frecuente de alguien que acaba de recibir un folleto, y tratarla como un
 * cero lo castigaría por no saber. Elegirla baja la confianza y produce un
 * paso concreto para averiguarlo.
 */
export function CriterionField({
  criterion,
  value,
  onChange,
}: {
  criterion: Criterion;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <fieldset className="border-t border-grafito/15 pt-5 first:border-0 first:pt-0">
      <legend className="sr-only">{criterion.question}</legend>

      <div className="flex items-start justify-between gap-3">
        <p className="text-marfil">
          {criterion.question}
          {criterion.knockout && (
            <span className="ml-2 whitespace-nowrap rounded border border-alerta/50 px-1.5 py-0.5 text-xs text-alerta">
              eliminatorio
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          aria-label={`Por qué importa: ${criterion.question}`}
          className="mt-0.5 shrink-0 text-grafito-texto transition-colors hover:text-dorado"
        >
          <HelpCircle size={16} />
        </button>
      </div>

      {showHelp && (
        <p className="mt-2 rounded-md border border-grafito/20 bg-obsidiana px-4 py-3 text-sm leading-relaxed text-marfil/70">
          {criterion.help}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {criterion.choices.map((choice) => (
          <Option
            key={choice.value}
            selected={value === choice.value}
            onClick={() => onChange(choice.value)}
          >
            {choice.label}
          </Option>
        ))}
        <Option
          selected={value === undefined}
          onClick={() => onChange(undefined)}
          muted
        >
          No sé todavía
        </Option>
      </div>
    </fieldset>
  );
}

function Option({
  selected,
  onClick,
  muted,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-md border px-3.5 py-2 text-sm transition-colors ${
        selected
          ? muted
            ? 'border-grafito/60 bg-grafito/15 text-marfil/80'
            : 'border-dorado bg-dorado/10 text-dorado'
          : 'border-grafito/30 text-marfil/60 hover:border-grafito/60 hover:text-marfil'
      }`}
    >
      {children}
    </button>
  );
}
