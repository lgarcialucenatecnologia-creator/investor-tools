import type { ChecklistEvaluation } from '@/lib/api/types';
import { sectionAnchor } from './status';

/**
 * Una barra por criterio, con su puntaje y cuánto lleva evaluado. Cada fila
 * salta a su sección: con 41 puntos en la página, el resumen es también el
 * índice.
 */
export function ExecutiveSummary({
  evaluation,
}: {
  evaluation: ChecklistEvaluation;
}) {
  return (
    <section className="surface p-7">
      <h2 className="font-display text-xl text-marfil">Resumen ejecutivo</h2>
      <p className="mt-1 text-sm text-grafito-texto">
        Puntaje de cada criterio sobre lo que ya calificaste.
      </p>

      <ul className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2">
        {evaluation.sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${sectionAnchor(section.id)}`}
              className="group block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-marfil/80 transition-colors group-hover:text-marfil">
                  {section.name}
                </span>
                <span className="shrink-0 tabular-nums text-marfil">
                  {section.score === null ? '—' : `${section.score}%`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-grafito/25">
                <span
                  className="block h-full rounded bg-dorado/80 transition-[width] duration-300"
                  style={{ width: `${section.score ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-grafito-texto">
                {section.evaluated}/{section.total} evaluados · pesa{' '}
                {section.weight}%
              </p>
            </a>
          </li>
        ))}
      </ul>

      {evaluation.weakItems.length > 0 && (
        <div className="mt-8 border-t border-grafito/15 pt-6">
          <h3 className="text-sm text-marfil">Puntos a revisar antes de firmar</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {evaluation.weakItems.map((item) => (
              <li
                key={item.itemId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-marfil/75">
                  {item.title}
                  <span className="text-grafito-texto"> · {item.sectionName}</span>
                </span>
                <span
                  className={`shrink-0 tabular-nums ${item.knockout ? 'text-alerta' : 'text-grafito-texto'}`}
                >
                  {item.knockout ? 'eliminatorio · ' : ''}
                  {item.rating}/5
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
