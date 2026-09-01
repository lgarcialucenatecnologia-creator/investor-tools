import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { BuyingRange as Range } from '@/lib/api/types';
import { money } from '@/lib/format';

/**
 * El rango de compra, mostrado como el recorrido del cálculo y no como dos
 * cifras sueltas. Que se vea que la reserva se resta ANTES es la mitad de la
 * lección del Módulo 1.
 */
export function BuyingRange({ range }: { range: Range }) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border border-dorado/40 bg-dorado/5 p-7">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-dorado" size={19} />
        <h2 className="font-display text-xl text-marfil">Tu rango de compra</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <dl className="flex flex-col gap-3 text-sm">
          <Row label="Para la operación" value={money(range.forOperation)} />
          <Row
            label="Reserva protegida"
            value={`${Math.round(range.reserveShare * 100)}%`}
            note="no se toca"
          />
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-grafito/20 pt-4">
            <dt className="font-display text-lg text-marfil">
              Presupuesto máximo
            </dt>
            <dd className="font-display text-2xl tabular-nums text-dorado">
              {money(range.maxBudget)}
            </dd>
          </div>
        </dl>

        <dl className="flex flex-col justify-end gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-4 border-t border-grafito/20 pt-4">
            <dt className="font-display text-lg text-marfil">
              Cuota máxima sostenible
            </dt>
            <dd className="font-display text-2xl tabular-nums text-dorado">
              {money(range.maxInstallment)}
            </dd>
          </div>
          <p className="text-xs text-grafito-texto">
            Son dos números distintos y hay que respetar los dos: uno limita qué
            propiedad puedes mirar, el otro si puedes sostenerla.
          </p>
        </dl>
      </div>

      {range.alerts.length > 0 && (
        <ul className="flex flex-col gap-3 border-t border-grafito/20 pt-5">
          {range.alerts.map((alert, index) => (
            <li
              key={index}
              className={`flex gap-3 text-sm ${
                alert.severity === 'critica' ? 'text-alerta' : 'text-marfil/70'
              }`}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{alert.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-marfil/70">
        {label}
        {note && (
          <span className="ml-2 text-xs text-grafito-texto">({note})</span>
        )}
      </dt>
      <dd className="shrink-0 tabular-nums text-marfil">{value}</dd>
    </div>
  );
}
