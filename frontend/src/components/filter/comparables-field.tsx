'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Comparable } from '@/lib/api/types';
import { money, number as formatNumber } from '@/lib/format';

export interface ComparableDraft {
  reference: string;
  areaM2: string;
  price: string;
}

export const emptyComparable = (): ComparableDraft => ({
  reference: '',
  areaM2: '',
  price: '',
});

/** Solo las filas completas cuentan; las demás se ignoran sin protestar. */
export function toComparables(drafts: ComparableDraft[]): Comparable[] {
  return drafts
    .map((draft) => ({
      reference: draft.reference.trim(),
      areaM2: Number(draft.areaM2.replace(/\D/g, '')),
      price: Number(draft.price.replace(/\D/g, '')),
    }))
    .filter((c) => c.reference.length >= 2 && c.areaM2 > 0 && c.price > 0);
}

export function ComparablesField({
  drafts,
  onChange,
}: {
  drafts: ComparableDraft[];
  onChange: (drafts: ComparableDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<ComparableDraft>) =>
    onChange(drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const valid = toComparables(drafts);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-marfil">Comparables de la zona</p>
        <p className="mt-1 text-sm text-grafito-texto">
          Dos o más inmuebles parecidos y su precio de venta. De aquí sale lo
          que de verdad se está pagando.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {drafts.map((draft, index) => {
          const perM2 =
            Number(draft.areaM2.replace(/\D/g, '')) > 0 &&
            Number(draft.price.replace(/\D/g, '')) > 0
              ? Number(draft.price.replace(/\D/g, '')) /
                Number(draft.areaM2.replace(/\D/g, ''))
              : null;

          return (
            <li key={index} className="flex flex-wrap items-start gap-2">
              <Input
                aria-label={`Referencia del comparable ${index + 1}`}
                placeholder="Torre Aralia 301"
                value={draft.reference}
                onChange={(e) => update(index, { reference: e.target.value })}
                className="min-w-[10rem] flex-1"
              />
              <Input
                aria-label={`Área del comparable ${index + 1}`}
                inputMode="numeric"
                placeholder="m²"
                value={draft.areaM2}
                onChange={(e) =>
                  update(index, { areaM2: e.target.value.replace(/\D/g, '') })
                }
                className="w-20 tabular-nums"
              />
              <Input
                aria-label={`Precio del comparable ${index + 1}`}
                inputMode="numeric"
                placeholder="Precio"
                value={
                  draft.price ? formatNumber(Number(draft.price)) : ''
                }
                onChange={(e) =>
                  update(index, { price: e.target.value.replace(/\D/g, '') })
                }
                className="w-40 tabular-nums"
              />
              <span className="min-w-[7rem] pt-2 text-xs tabular-nums text-grafito-texto">
                {perM2 ? `${money(Math.round(perM2))}/m²` : ''}
              </span>
              {drafts.length > 1 && (
                <button
                  type="button"
                  aria-label={`Quitar comparable ${index + 1}`}
                  onClick={() => onChange(drafts.filter((_, i) => i !== index))}
                  className="mt-1 grid size-9 place-items-center rounded-md text-grafito-texto transition-colors hover:text-alerta"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => onChange([...drafts, emptyComparable()])}
          className="flex items-center gap-2 text-sm text-dorado underline-offset-4 hover:underline"
        >
          <Plus size={15} />
          Agregar comparable
        </button>
        <span className="text-xs text-grafito-texto">
          {valid.length < 2
            ? `Faltan ${2 - valid.length} para poder calcular`
            : `${valid.length} comparables completos`}
        </span>
      </div>
    </div>
  );
}
