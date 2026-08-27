import { AlertTriangle, ArrowRight, CircleAlert, ListChecks } from 'lucide-react';
import Link from 'next/link';
import type { Assessment, Criterion, Verdict } from '@/lib/api/types';
import { money } from '@/lib/format';
import { ScoreDial } from './score-dial';

const BORDER: Record<Verdict, string> = {
  verde: 'border-dorado/50',
  amarillo: 'border-oro/40',
  rojo: 'border-alerta/40',
  sin_datos: 'border-grafito/30',
};

export function ResultPanel({
  assessment,
  criteria,
}: {
  assessment: Assessment;
  criteria: Criterion[];
}) {
  const { evaluation: e, pricing } = assessment;
  const question = (id: string) =>
    criteria.find((c) => c.id === id)?.question ?? id;

  return (
    <div className="flex flex-col gap-5">
      <section className={`rounded-lg border ${BORDER[e.verdict]} bg-nocturno p-7`}>
        <p className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Veredicto
        </p>
        <h2 className="mt-3 font-display text-2xl text-marfil">{e.label}</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-marfil/75">
          {e.summary}
        </p>

        <div className="mt-7 border-t border-grafito/20 pt-7">
          <ScoreDial
            score={e.score}
            confidence={e.confidence}
            verdict={e.verdict}
          />
        </div>
      </section>

      {/* Dónde está fuerte y dónde flaquea. Las categorías sin responder se
          muestran igual: el hueco es información. */}
      <section className="rounded-lg border border-grafito/20 bg-nocturno p-7">
        <h3 className="font-display text-lg text-marfil">Por categoría</h3>
        <ul className="mt-5 flex flex-col gap-4">
          {e.categories.map((category) => (
            <li key={category.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-marfil/80">
                  {category.name}
                  <span className="ml-2 text-xs text-grafito-texto">
                    peso {category.weight}% · {category.answered}/
                    {category.total} respondidas
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-marfil">
                  {category.score ?? '—'}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-grafito/20">
                <span
                  className={`block h-full rounded ${
                    category.score === null
                      ? ''
                      : category.score >= 75
                        ? 'bg-dorado'
                        : category.score >= 50
                          ? 'bg-oro'
                          : 'bg-alerta'
                  }`}
                  style={{ width: `${category.score ?? 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {e.alerts.length > 0 && (
        <section className="rounded-lg border border-alerta/30 bg-alerta/5 p-7">
          <h3 className="flex items-center gap-2 font-display text-lg text-marfil">
            <AlertTriangle size={18} className="text-alerta" />
            Lo que hay que mirar
          </h3>
          <ul className="mt-5 flex flex-col gap-4">
            {e.alerts.map((alert) => (
              <li key={alert.criterionId} className="flex gap-3">
                <CircleAlert
                  size={17}
                  className={`mt-1 shrink-0 ${
                    alert.severity === 'critica' ? 'text-alerta' : 'text-oro'
                  }`}
                />
                <div>
                  <p className="text-marfil">
                    {alert.question}
                    {alert.severity === 'critica' && (
                      <span className="ml-2 rounded border border-alerta/50 px-1.5 py-0.5 text-xs text-alerta">
                        eliminatorio
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-marfil/70">{alert.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {e.nextSteps.length > 0 && (
        <section className="rounded-lg border border-grafito/20 bg-nocturno p-7">
          <h3 className="flex items-center gap-2 font-display text-lg text-marfil">
            <ListChecks size={18} className="text-dorado" />
            Qué te falta averiguar
          </h3>
          <p className="mt-2 text-sm text-grafito-texto">
            Cada respuesta que consigas sube la confianza del resultado.
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {e.nextSteps.map((step) => (
              <li key={step.criterionId} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-dorado" />
                <div>
                  <p className="text-marfil/80">{question(step.criterionId)}</p>
                  <p className="mt-0.5 text-sm text-grafito-texto">
                    {step.action}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pricing && (
        <section className="rounded-lg border border-grafito/20 bg-nocturno p-7">
          <h3 className="font-display text-lg text-marfil">
            El precio contra la zona
          </h3>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <Row
              label="Lo que se está pagando"
              value={`${money(pricing.medianPricePerM2)} / m²`}
              note="mediana de tus comparables"
            />
            <Row label="Valor de mercado" value={money(pricing.marketValue)} />
            <Row
              label="Costos de entrada y margen"
              value={`− ${money(pricing.entryCosts + pricing.safetyMargin)}`}
            />
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-grafito/20 pt-4">
              <dt className="font-display text-marfil">Tu precio máximo</dt>
              <dd className="font-display text-xl tabular-nums text-dorado">
                {money(pricing.maxPrice)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* Un veredicto que no es verde no debe dejar a la persona sola con un
          número: el siguiente paso natural es preguntarle a Luifer. */}
      {(e.verdict === 'amarillo' || e.verdict === 'rojo') && (
        <Link
          href="/dashboard/consultor"
          className="flex items-center justify-between gap-4 rounded-lg border border-azul/60 bg-azul/15 px-6 py-5 transition-colors hover:border-azul"
        >
          <span className="text-marfil">
            ¿Quieres revisar esto con el Consultor Luifer?
          </span>
          <ArrowRight size={18} className="shrink-0 text-marfil" />
        </Link>
      )}
    </div>
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
        {note && <span className="ml-2 text-xs text-grafito-texto">({note})</span>}
      </dt>
      <dd className="shrink-0 tabular-nums text-marfil/70">{value}</dd>
    </div>
  );
}
