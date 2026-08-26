import { Check, X } from 'lucide-react';
import type { FilterResult } from '@/lib/api/types';
import { money } from '@/lib/format';

/**
 * El veredicto y, debajo, las razones. Un sí o un no sin el porqué no sirve
 * para decidir: la persona tiene que poder discutirlo con el vendedor.
 */
export function Verdict({
  result,
  listedPrice,
}: {
  result: FilterResult;
  listedPrice: number;
}) {
  const gap = listedPrice - result.maxPrice;

  return (
    <div
      className={`rounded-lg border p-7 ${
        result.passes
          ? 'border-dorado/50 bg-dorado/5'
          : 'border-alerta/40 bg-alerta/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full ${
            result.passes
              ? 'bg-dorado text-obsidiana'
              : 'bg-alerta text-obsidiana'
          }`}
        >
          {result.passes ? <Check size={19} /> : <X size={19} />}
        </span>
        <p className="font-display text-2xl text-marfil">
          {result.passes ? 'Pasa el filtro' : 'No pasa el filtro'}
        </p>
      </div>

      <p className="mt-4 leading-relaxed text-marfil/80">
        {result.passes ? (
          <>
            Lo piden en{' '}
            <span className="text-marfil">{money(listedPrice)}</span> y tu
            precio máximo es {money(result.maxPrice)}. Entrando aquí, ganas{' '}
            <span className="text-dorado">{money(-gap)}</span> el día que
            firmas.
          </>
        ) : (
          <>
            Lo piden en{' '}
            <span className="text-marfil">{money(listedPrice)}</span>, y tu
            precio máximo es {money(result.maxPrice)}. Están pidiendo{' '}
            <span className="text-alerta">{money(gap)}</span> de más. Si no
            bajan hasta ahí, no entra.
          </>
        )}
      </p>

      <dl className="mt-7 flex flex-col gap-3 border-t border-grafito/20 pt-6 text-sm">
        <Row
          label="Lo que se está pagando en la zona"
          value={`${money(result.medianPricePerM2)} / m²`}
          note="mediana de tus comparables"
        />
        <Row label="Valor de mercado" value={money(result.marketValue)} strong />
        <Row
          label="Escrituración y registro"
          value={`− ${money(result.deedCost)}`}
        />
        <Row label="Impuestos" value={`− ${money(result.taxCost)}`} />
        {result.refurbishCost > 0 && (
          <Row
            label="Adecuaciones"
            value={`− ${money(result.refurbishCost)}`}
          />
        )}
        <Row
          label="Margen de seguridad"
          value={`− ${money(result.safetyMargin)}`}
          note="lo que ganas al comprar"
        />
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-grafito/20 pt-4">
          <dt className="font-display text-lg text-marfil">Tu precio máximo</dt>
          <dd className="font-display text-2xl tabular-nums text-dorado">
            {money(result.maxPrice)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? 'text-marfil' : 'text-marfil/70'}>
        {label}
        {note && (
          <span className="ml-2 text-xs text-grafito-texto">({note})</span>
        )}
      </dt>
      <dd
        className={`shrink-0 tabular-nums ${strong ? 'text-marfil' : 'text-marfil/70'}`}
      >
        {value}
      </dd>
    </div>
  );
}
