'use client';

import { useState } from 'react';
import { millions, money } from '@/lib/format';

/**
 * El capital al final de cada año contra la meta.
 *
 * Una sola serie, así que no lleva leyenda: el título la nombra y la meta se
 * rotula sobre su propia línea. Cada barra muestra su cifra al pasar el
 * cursor o al enfocarla con el teclado, y la tabla de abajo da los mismos
 * datos sin depender de la vista.
 */
export function ProjectionChart({
  yearly,
  target,
  reachedYear,
}: {
  yearly: { year: number; capital: number }[];
  target: number;
  /** Año en que se cruza la meta, para marcarlo. */
  reachedYear: number | null;
}) {
  const [active, setActive] = useState<number | null>(null);

  const top = Math.max(target, ...yearly.map((p) => p.capital), 1) * 1.08;
  const targetPct = (target / top) * 100;
  // Rótulos del eje x cada 5 años, más el último.
  const labelEvery = yearly.length > 12 ? 5 : 1;
  const shown = active === null ? null : yearly[active];

  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-marfil">Tu capital invertido, año a año</span>
        <span className="text-xs text-grafito-texto" aria-live="polite">
          {shown
            ? `Año ${shown.year}: ${money(shown.capital)}`
            : 'Pasa el cursor por una barra para ver la cifra'}
        </span>
      </figcaption>

      <div className="relative h-56 pl-2">
        {/* Rejilla mínima: solo la base. La meta es la única referencia. */}
        <div className="absolute inset-x-2 bottom-0 border-b border-grafito/30" />

        <div
          className="pointer-events-none absolute inset-x-2 z-10 border-t-2 border-dashed border-marfil/70"
          style={{ bottom: `${targetPct}%` }}
        >
          {/* A la izquierda: ahí las barras son bajas y no la tapan. */}
          <span className="absolute -top-6 left-0 rounded bg-obsidiana/90 px-1.5 text-xs text-marfil">
            Meta {millions(target)}
          </span>
        </div>

        <ol className="absolute inset-x-2 bottom-0 top-0 flex items-end gap-[2px]">
          {yearly.map((point, index) => {
            const height = Math.max(0, (point.capital / top) * 100);
            const crossed = reachedYear !== null && point.year >= reachedYear;
            return (
              <li key={point.year} className="flex h-full min-w-0 flex-1 items-end">
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  aria-label={`Año ${point.year}: ${money(point.capital)}`}
                  // El área sensible es toda la columna, no solo la barra:
                  // una barra corta de los primeros años sería imposible de
                  // apuntar.
                  className="group flex h-full w-full items-end outline-none"
                >
                  <span
                    className={`block w-full rounded-t-[4px] transition-colors ${
                      crossed ? 'bg-dorado' : 'bg-dorado/55'
                    } ${active === index ? 'brightness-125' : ''} group-focus-visible:ring-2 group-focus-visible:ring-ring`}
                    style={{ height: `${height}%` }}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Solo el número: «Año 5» repetido no cabe en un celular. */}
      <div className="flex justify-between pl-2 text-xs tabular-nums text-grafito-texto">
        {yearly
          .filter(
            (p, i) => i % labelEvery === 0 || i === yearly.length - 1,
          )
          .map((p) => (
            <span key={p.year}>{p.year === 0 ? 'Hoy' : p.year}</span>
          ))}
      </div>
      <p className="-mt-2 text-right text-xs text-grafito-texto">años desde hoy</p>

      <details className="text-sm">
        <summary className="cursor-pointer text-grafito-texto hover:text-marfil">
          Ver la tabla año a año
        </summary>
        <table className="mt-3 w-full text-left text-xs tabular-nums">
          <thead className="text-grafito-texto">
            <tr>
              <th className="py-1 font-normal">Año</th>
              <th className="py-1 text-right font-normal">Capital</th>
              <th className="py-1 text-right font-normal">De la meta</th>
            </tr>
          </thead>
          <tbody className="text-marfil/80">
            {yearly.map((p) => (
              <tr key={p.year} className="border-t border-grafito/15">
                <td className="py-1">{p.year === 0 ? 'Hoy' : p.year}</td>
                <td className="py-1 text-right">{money(p.capital)}</td>
                <td className="py-1 text-right">
                  {target > 0 ? `${Math.round((p.capital / target) * 100)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
