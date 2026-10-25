'use client';

import { useMemo, useState } from 'react';
import { Calculator, Loader2, Plus, Target, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import type {
  CashEvent,
  PensionGoal,
  PensionInput,
  PensionOverview,
  PensionResult,
} from '@/lib/api/types';
import { millions, money } from '@/lib/format';
import { ProjectionChart } from './projection-chart';

const MAX_EVENTS = 20;

interface EventDraft {
  key: number;
  label: string;
  /** Siempre positivo; el sentido lo da `direction`. */
  amount: number | null;
  direction: 'entra' | 'sale';
  month: string;
}

let nextKey = 0;
const toDraft = (event: CashEvent): EventDraft => ({
  key: nextKey++,
  label: event.label,
  amount: Math.abs(event.amount),
  direction: event.amount < 0 ? 'sale' : 'entra',
  month: String(event.month),
});
const emptyDraft = (index: number): EventDraft => ({
  key: nextKey++,
  label: `Activo ${index + 1}`,
  amount: null,
  direction: 'entra',
  month: '0',
});

/** «4 años y 3 meses». */
function duration(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} año${years === 1 ? '' : 's'}`);
  if (rest > 0) parts.push(`${rest} mes${rest === 1 ? '' : 'es'}`);
  return parts.join(' y ');
}

function arrivalDate(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

const percentLabel = (rate: number) =>
  `${(rate * 100).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;

export function PensionScreen({ initial }: { initial: PensionOverview }) {
  const start = initial.input;
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(
    start.monthlyIncome || null,
  );
  const [additionalIncome, setAdditionalIncome] = useState<number | null>(
    start.additionalIncome || null,
  );
  const [showAdditional, setShowAdditional] = useState(start.additionalIncome > 0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number | null>(
    start.monthlyExpenses || null,
  );
  const [expenseReduction, setExpenseReduction] = useState<number | null>(
    start.expenseReduction || null,
  );
  const [showReduction, setShowReduction] = useState(start.expenseReduction > 0);
  const [goal, setGoal] = useState<PensionGoal>(start.goal);
  const [rate, setRate] = useState(
    String(Math.round(start.annualReturnRate * 10000) / 100),
  );
  const [drafts, setDrafts] = useState<EventDraft[]>(() =>
    start.events.length > 0 ? start.events.map(toDraft) : [emptyDraft(0)],
  );

  const [result, setResult] = useState<PensionResult | null>(initial.result);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [explainerOpen, setExplainerOpen] = useState(!initial.saved);

  /** Cualquier cambio deja el resultado desactualizado hasta recalcular. */
  function touch<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setStale(true);
    };
  }

  // Los recursos mensuales se ven al instante: son una resta, no hace falta
  // esperar al servidor para mostrarla.
  const investable = useMemo(() => {
    const income = (monthlyIncome ?? 0) + (showAdditional ? (additionalIncome ?? 0) : 0);
    const expenses = Math.max(
      0,
      (monthlyExpenses ?? 0) - (showReduction ? (expenseReduction ?? 0) : 0),
    );
    return income - expenses;
  }, [monthlyIncome, additionalIncome, showAdditional, monthlyExpenses, expenseReduction, showReduction]);

  function updateDraft(key: number, patch: Partial<EventDraft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    setStale(true);
  }

  function buildInput(): PensionInput | string {
    const annual = Number(rate.replace(',', '.')) / 100;
    if (!Number.isFinite(annual) || annual < 0.01 || annual > 0.2) {
      return 'La rentabilidad debe estar entre 1% y 20%.';
    }
    const events: CashEvent[] = [];
    for (const draft of drafts) {
      if (!draft.amount) continue;
      const month = Number(draft.month || '0');
      if (!Number.isInteger(month) || month < 0 || month > 600) {
        return `El mes de «${draft.label || 'un activo'}» debe ser un número entre 0 y 600.`;
      }
      events.push({
        label: draft.label.trim() || 'Activo',
        amount: draft.direction === 'sale' ? -draft.amount : draft.amount,
        month,
      });
    }
    return {
      monthlyIncome: monthlyIncome ?? 0,
      additionalIncome: showAdditional ? (additionalIncome ?? 0) : 0,
      monthlyExpenses: monthlyExpenses ?? 0,
      expenseReduction: showReduction ? (expenseReduction ?? 0) : 0,
      goal,
      annualReturnRate: annual,
      events,
    };
  }

  async function handleCalculate() {
    const input = buildInput();
    if (typeof input === 'string') {
      setError(input);
      return;
    }
    if (!monthlyExpenses) {
      setError('Escribe tus gastos mensuales: sin ellos no hay meta que calcular.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Calcular es también guardar: es SU meta, uno solo, y tiene que
      // estar ahí la próxima vez que entre.
      const overview = await api<PensionOverview>('/pension', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      setResult(overview.result);
      setSavedAt(overview.updatedAt);
      setStale(false);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Target}
        eyebrow="Cuánto necesitas para vivir de rentas"
        title="Mi Meta de Pensión"
        description="El capital invertido que, solo con sus rentas, paga tu vida — sin tener que gastártelo. Pensionarte con bienes raíces es llegar a esa meta."
      />

      <section className="surface p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl text-marfil">
            ¿Qué considera este cálculo?
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExplainerOpen((open) => !open)}
            aria-expanded={explainerOpen}
          >
            {explainerOpen ? 'Entendido' : 'Ver explicación'}
          </Button>
        </div>
        {explainerOpen && (
          <div className="mt-4 flex flex-col gap-3 leading-relaxed text-marfil/75">
            <p>
              Tu meta es el capital que, invertido a la rentabilidad que
              esperas, te deja cada mes lo suficiente para cubrir tus gastos
              <strong className="font-medium text-marfil"> sin tocar el capital</strong>.
              Si lo vas consumiendo, tu pensión tiene fecha de vencimiento; si
              vives de las rentas, queda para los tuyos.
            </p>
            <p>
              <strong className="font-medium text-marfil">Ejemplo:</strong> si
              tus gastos son de $6.000.000 al mes y tus inversiones rentan 15% al
              año después de inflación, necesitas alrededor de $512 millones
              invertidos para que paguen esos $6.000.000 cada mes.
            </p>
            <p>
              Todo está en pesos de hoy: la rentabilidad que pones ya descuenta
              la inflación. Así la meta no se infla con los años y lo que ves
              es lo que de verdad necesitas.
            </p>
          </div>
        )}
      </section>

      {initial.prefilledFromRoute && !initial.saved && (
        <p className="rounded-md border border-dorado/30 bg-dorado/5 px-5 py-3 text-sm text-marfil/80">
          Trajimos tus ingresos, obligaciones y dinero disponible de Mi Ruta de
          90 Días, sin tu reserva de seguridad. Revísalos y ajusta lo que haga
          falta.
        </p>
      )}

      <section className="flex flex-col gap-5 surface p-7">
        <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Tus ingresos mensuales
        </h2>
        <MoneyInput
          label="Ingreso mensual"
          value={monthlyIncome}
          onChange={touch(setMonthlyIncome)}
          placeholder="10.000.000"
        />
        {showAdditional ? (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <MoneyInput
                label="Ingreso adicional"
                value={additionalIncome}
                onChange={touch(setAdditionalIncome)}
                hint="Clases, arriendos, un negocio aparte: lo que entra además del ingreso principal."
                placeholder="2.000.000"
              />
            </div>
            <RemoveButton
              label="Quitar el ingreso adicional"
              onClick={() => {
                setShowAdditional(false);
                setStale(true);
              }}
            />
          </div>
        ) : (
          <AddButton onClick={() => setShowAdditional(true)}>
            Agregar un ingreso adicional
          </AddButton>
        )}
      </section>

      <section className="flex flex-col gap-5 surface p-7">
        <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Tus gastos mensuales
        </h2>
        <MoneyInput
          label="Costos y gastos del mes"
          value={monthlyExpenses}
          onChange={touch(setMonthlyExpenses)}
          placeholder="8.000.000"
        />
        {showReduction ? (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <MoneyInput
                label="Reducción de gastos"
                value={expenseReduction}
                onChange={touch(setExpenseReduction)}
                hint="Lo que puedes recortar con orden, sin cambiar tu calidad de vida."
                placeholder="1.000.000"
              />
            </div>
            <RemoveButton
              label="Quitar la reducción de gastos"
              onClick={() => {
                setShowReduction(false);
                setStale(true);
              }}
            />
          </div>
        ) : (
          <AddButton onClick={() => setShowReduction(true)}>
            Agregar una reducción de gastos
          </AddButton>
        )}
      </section>

      <section
        className={`rounded-lg border p-7 ${
          investable < 0
            ? 'border-alerta/40 bg-alerta/5'
            : 'border-dorado/40 bg-nocturno'
        }`}
        aria-live="polite"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Recursos mensuales para invertir
        </p>
        <p
          className={`mt-3 font-display text-4xl tabular-nums ${
            investable < 0 ? 'text-alerta' : 'text-dorado'
          }`}
        >
          {money(investable)}
        </p>
        {investable < 0 && (
          <p className="mt-2 text-sm text-marfil/75">
            Hoy gastas más de lo que entra. Antes de invertir hay que ordenar
            esta parte: es el primer paso de Mi Ruta de 90 Días.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-5 surface p-7">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
            Lo que tienes y lo que vas a mover
          </h2>
          <p className="mt-2 text-sm text-marfil/70">
            Ahorros, CDT, un inmueble o un vehículo que piensas vender: lo que
            puede convertirse en capital invertido, y en qué mes. También las
            salidas grandes que ya sabes que vienen. El mes 0 es hoy.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {drafts.map((draft) => (
            <li
              key={draft.key}
              className="grid gap-3 rounded-lg border border-grafito/20 bg-obsidiana/60 p-4 sm:grid-cols-[1fr_auto]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Input
                    aria-label="Nombre del activo o movimiento"
                    value={draft.label}
                    maxLength={80}
                    onChange={(e) => updateDraft(draft.key, { label: e.target.value })}
                    className="flex-1"
                  />
                  <div className="flex shrink-0 gap-1" role="group" aria-label="Sentido">
                    {(['entra', 'sale'] as const).map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        aria-pressed={draft.direction === direction}
                        onClick={() => updateDraft(draft.key, { direction })}
                        className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                          draft.direction === direction
                            ? direction === 'entra'
                              ? 'border-dorado bg-dorado/10 text-dorado'
                              : 'border-alerta bg-alerta/10 text-alerta'
                            : 'border-grafito/30 text-marfil/60 hover:text-marfil'
                        }`}
                      >
                        {direction === 'entra' ? 'Entra' : 'Sale'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <MoneyInput
                    label={draft.direction === 'entra' ? 'Monto que entra' : 'Monto que sale'}
                    value={draft.amount}
                    onChange={(amount) => updateDraft(draft.key, { amount })}
                    placeholder="0"
                  />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`month-${draft.key}`}>En el mes</Label>
                    <Input
                      id={`month-${draft.key}`}
                      inputMode="numeric"
                      value={draft.month}
                      onChange={(e) =>
                        updateDraft(draft.key, {
                          month: e.target.value.replace(/\D/g, '').slice(0, 3),
                        })
                      }
                      className="tabular-nums"
                    />
                  </div>
                </div>
              </div>
              <div className="flex sm:items-start">
                <RemoveButton
                  label={`Quitar ${draft.label || 'este activo'}`}
                  onClick={() => {
                    setDrafts((prev) => prev.filter((d) => d.key !== draft.key));
                    setStale(true);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>

        {drafts.length < MAX_EVENTS && (
          <AddButton
            onClick={() => setDrafts((prev) => [...prev, emptyDraft(prev.length)])}
          >
            Agregar activo o movimiento
          </AddButton>
        )}
      </section>

      <section className="grid gap-6 surface p-7 md:grid-cols-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm text-marfil">
            Qué tienen que pagar tus rentas
          </legend>
          {(
            [
              ['gastos', 'Mis gastos', 'Te pensionas con tu nivel de vida actual.'],
              ['ingreso', 'Todo mi ingreso actual', 'Gastos y además lo que hoy inviertes.'],
            ] as const
          ).map(([value, title, hint]) => (
            <button
              key={value}
              type="button"
              aria-pressed={goal === value}
              onClick={() => touch(setGoal)(value)}
              className={`rounded-md border px-4 py-3 text-left transition-colors ${
                goal === value
                  ? 'border-dorado bg-dorado/10'
                  : 'border-grafito/30 hover:border-grafito/60'
              }`}
            >
              <span className={`block text-sm ${goal === value ? 'text-dorado' : 'text-marfil'}`}>
                {title}
              </span>
              <span className="mt-0.5 block text-xs text-grafito-texto">{hint}</span>
            </button>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pension-rate">Rentabilidad anual neta</Label>
          <div className="relative">
            <Input
              id="pension-rate"
              inputMode="decimal"
              value={rate}
              onChange={(e) => touch(setRate)(e.target.value.replace(/[^\d.,]/g, ''))}
              className="pr-8 tabular-nums"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grafito-texto">
              %
            </span>
          </div>
          <p className="text-xs leading-relaxed text-grafito-texto">
            Después de gastos e inflación. Por defecto{' '}
            {percentLabel(initial.defaultReturnRate)}. Escríbela ya descontada la
            inflación. Si la tuya es menor, bájala: es mejor llegar antes de lo
            planeado que después.
          </p>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        onClick={() => void handleCalculate()}
        disabled={busy}
        className="h-12 text-base"
      >
        {busy ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <Calculator size={18} />
            Calcular mi meta
          </>
        )}
      </Button>

      {result && (
        <Result result={result} stale={stale} savedAt={savedAt} goal={goal} />
      )}
    </div>
  );
}

function Result({
  result,
  stale,
  savedAt,
  goal,
}: {
  result: PensionResult;
  stale: boolean;
  savedAt: string | null;
  goal: PensionGoal;
}) {
  const reached = result.reachedInMonths;
  const reachedYear = reached === null ? null : Math.ceil(reached / 12);

  if (result.targetCapital <= 0) {
    return (
      <p className="rounded-lg border border-dashed border-grafito/30 px-6 py-8 text-center text-grafito-texto">
        Con gastos en cero no hay meta que calcular. Revisa tus gastos
        mensuales.
      </p>
    );
  }

  return (
    <section
      aria-live="polite"
      className={`flex flex-col gap-8 rounded-lg border border-dorado/40 bg-nocturno p-7 transition-opacity ${
        stale ? 'opacity-50' : ''
      }`}
    >
      {stale && (
        <p className="text-sm text-oro">
          Cambiaste datos: pulsa «Calcular mi meta» para actualizar.
        </p>
      )}

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Tu Meta de Pensión
        </p>
        <p className="mt-3 font-display text-4xl tabular-nums text-dorado md:text-5xl">
          {money(result.targetCapital)}
        </p>
        <p className="mt-3 max-w-xl leading-relaxed text-marfil/75">
          Invertido a {percentLabel(result.annualReturnRate)} al año, te
          deja {money(result.targetMonthlyIncome)} cada mes para{' '}
          {goal === 'gastos' ? 'cubrir tus gastos' : 'reemplazar tu ingreso'}{' '}
          sin tocar el capital.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat label="Tienes hoy" value={millions(result.startingCapital)} />
        <Stat label="Te falta" value={millions(result.gap)} />
        <div className="rounded-lg border border-grafito/20 bg-obsidiana/60 p-4">
          <dt className="text-xs text-grafito-texto">Avance</dt>
          <dd className="mt-1 font-display text-2xl tabular-nums text-marfil">
            {result.progress}%
          </dd>
          <div className="mt-2 h-1.5 overflow-hidden rounded bg-grafito/25">
            <span
              className="block h-full rounded bg-dorado"
              style={{ width: `${result.progress}%` }}
            />
          </div>
        </div>
      </dl>

      <div className="rounded-lg border border-grafito/20 bg-obsidiana/60 p-5 leading-relaxed">
        {reached === 0 ? (
          <p className="text-marfil">
            Ya llegaste: lo que tienes hoy, bien invertido, paga tu vida.
          </p>
        ) : reached !== null ? (
          <p className="text-marfil">
            {result.monthlyInvestable > 0
              ? `Invirtiendo ${money(result.monthlyInvestable)} al mes llegas en `
              : 'Sin aportes nuevos, solo con lo que ya tienes rindiendo, llegas en '}
            <strong className="font-medium text-dorado">{duration(reached)}</strong>
            , hacia {arrivalDate(reached)}.
          </p>
        ) : (
          <p className="text-marfil">
            {result.monthlyInvestable <= 0
              ? 'Con los gastos por encima del ingreso, el capital no crece por sí solo: a este ritmo no llegas.'
              : 'A este ritmo no llegas en los próximos 50 años.'}
          </p>
        )}
        {result.monthlyNeededForReference > 0 && (
          <p className="mt-2 text-sm text-marfil/70">
            Para llegar en {result.referenceYears} años necesitarías invertir{' '}
            {money(result.monthlyNeededForReference)} al mes
            {result.monthlyNeededForReference > result.monthlyInvestable
              ? `, ${money(result.monthlyNeededForReference - Math.max(0, result.monthlyInvestable))} más que hoy.`
              : '.'}
          </p>
        )}
      </div>

      <ProjectionChart
        yearly={result.yearly}
        target={result.targetCapital}
        reachedYear={reachedYear}
      />

      <p className="text-xs leading-relaxed text-grafito-texto">
        Cálculo en pesos de hoy, con la rentabilidad que elegiste. Es una guía
        para decidir con orden, no una promesa de rentabilidad.
        {savedAt &&
          ` Guardado el ${new Date(savedAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}.`}
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-grafito/20 bg-obsidiana/60 p-4">
      <dt className="text-xs text-grafito-texto">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums text-marfil">{value}</dd>
    </div>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 self-start rounded-md border border-dashed border-dorado/50 px-4 py-2 text-sm text-dorado transition-colors hover:bg-dorado/10"
    >
      <Plus size={15} />
      {children}
    </button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Quitar"
      className="grid size-9 shrink-0 place-items-center rounded-md text-grafito-texto transition-colors hover:text-alerta"
    >
      <Trash2 size={15} />
    </button>
  );
}
