/**
 * Mi Meta de Pensión: cuánto capital invertido necesitas para que sus
 * rentas paguen tu vida sin tocar el capital, y cuándo llegas.
 *
 * Decisiones de método, no detalles técnicos:
 *
 * 1. La meta vive de las RENTAS, no del capital. Gastarse el capital es
 *    pensionarse con fecha de vencimiento; el capital queda intacto y se
 *    hereda. Por eso la meta es una perpetuidad: rentas ÷ tasa mensual.
 *
 * 2. La rentabilidad es neta y real (ya descontada la inflación). Todo queda
 *    en pesos de hoy: la meta no crece por inflación y el resultado no
 *    promete una riqueza que la inflación se comería.
 *
 * 3. Si no llegas, no se inventa una fecha. Se dice cuánto tendrías que
 *    aportar al mes para llegar en un plazo razonable.
 */

/** Tope de la proyección: 50 años. Más allá no es un plan, es una apuesta. */
export const MAX_MONTHS = 600;

/** Plazo de referencia para «cuánto tendrías que aportar». */
export const REFERENCE_YEARS = 20;

export type PensionGoal = 'gastos' | 'ingreso';

export interface CashEvent {
  label: string;
  /** Positivo = entra al capital (vendes un activo); negativo = sale. */
  amount: number;
  /** 0 = hoy. */
  month: number;
}

export interface PensionInput {
  monthlyIncome: number;
  additionalIncome: number;
  monthlyExpenses: number;
  expenseReduction: number;
  /** Qué tienen que pagar las rentas: tus gastos, o todo tu ingreso actual. */
  goal: PensionGoal;
  /** Anual, neta y real. 0.15 = 15%. */
  annualReturnRate: number;
  events: CashEvent[];
}

export interface YearPoint {
  year: number;
  capital: number;
}

export interface PensionResult {
  totalIncome: number;
  adjustedExpenses: number;
  /** Lo que queda cada mes para invertir. Puede ser negativo. */
  monthlyInvestable: number;
  /** Lo que las rentas tienen que pagarte cada mes. */
  targetMonthlyIncome: number;
  /** Tu meta de pensión. */
  targetCapital: number;
  /** Lo que entra al capital hoy (eventos del mes 0). */
  startingCapital: number;
  gap: number;
  /** 0–100. */
  progress: number;
  /** Mes en que el capital alcanza la meta; `null` si no llega en 50 años. */
  reachedInMonths: number | null;
  /** Capital al final de cada año, desde hoy. */
  yearly: YearPoint[];
  /** Aporte mensual que haría llegar en `REFERENCE_YEARS`. */
  monthlyNeededForReference: number;
  referenceYears: number;
  annualReturnRate: number;
  monthlyReturnRate: number;
}

const round = (value: number) => Math.round(value);

/** Tasa mensual equivalente a una anual compuesta. */
export const monthlyRateOf = (annual: number) =>
  Math.pow(1 + annual, 1 / 12) - 1;

export function calculatePension(input: PensionInput): PensionResult {
  const i = monthlyRateOf(input.annualReturnRate);
  const totalIncome = input.monthlyIncome + input.additionalIncome;
  const adjustedExpenses = Math.max(
    0,
    input.monthlyExpenses - input.expenseReduction,
  );
  const monthlyInvestable = totalIncome - adjustedExpenses;
  const targetMonthlyIncome =
    input.goal === 'ingreso' ? totalIncome : adjustedExpenses;
  const targetCapital = i > 0 ? targetMonthlyIncome / i : 0;

  const eventsByMonth = new Map<number, number>();
  for (const event of input.events) {
    eventsByMonth.set(
      event.month,
      (eventsByMonth.get(event.month) ?? 0) + event.amount,
    );
  }

  const startingCapital = eventsByMonth.get(0) ?? 0;

  // Mes a mes: rinde lo que hay, entra el aporte y lo que se liquide ese mes.
  let capital = startingCapital;
  let reachedInMonths: number | null =
    targetCapital > 0 && capital >= targetCapital ? 0 : null;
  const monthly: number[] = [capital];

  for (let month = 1; month <= MAX_MONTHS; month += 1) {
    capital =
      capital * (1 + i) + monthlyInvestable + (eventsByMonth.get(month) ?? 0);
    monthly.push(capital);
    if (
      reachedInMonths === null &&
      targetCapital > 0 &&
      capital >= targetCapital
    ) {
      reachedInMonths = month;
    }
  }

  // La gráfica cubre hasta un par de años después de llegar, o 30 si no llega.
  const yearsShown =
    reachedInMonths === null
      ? 30
      : Math.min(50, Math.ceil(reachedInMonths / 12) + 2);
  const yearly: YearPoint[] = [];
  for (let year = 0; year <= yearsShown; year += 1) {
    yearly.push({ year, capital: round(monthly[year * 12]) });
  }

  return {
    totalIncome: round(totalIncome),
    adjustedExpenses: round(adjustedExpenses),
    monthlyInvestable: round(monthlyInvestable),
    targetMonthlyIncome: round(targetMonthlyIncome),
    targetCapital: round(targetCapital),
    startingCapital: round(startingCapital),
    gap: round(Math.max(0, targetCapital - startingCapital)),
    progress:
      targetCapital > 0
        ? Math.min(
            100,
            Math.max(0, round((startingCapital / targetCapital) * 100)),
          )
        : 0,
    reachedInMonths,
    yearly,
    monthlyNeededForReference: round(
      monthlyNeeded(targetCapital, eventsByMonth, i, REFERENCE_YEARS * 12),
    ),
    referenceYears: REFERENCE_YEARS,
    annualReturnRate: input.annualReturnRate,
    monthlyReturnRate: i,
  };
}

/**
 * Aporte mensual constante que, junto con lo que ya se va a liquidar, llega
 * a la meta en `months`. Cero si los activos solos ya alcanzan.
 */
function monthlyNeeded(
  target: number,
  eventsByMonth: Map<number, number>,
  i: number,
  months: number,
): number {
  if (target <= 0) return 0;

  let fromEvents = 0;
  for (const [month, amount] of eventsByMonth) {
    if (month <= months) fromEvents += amount * Math.pow(1 + i, months - month);
  }

  const growth = Math.pow(1 + i, months);
  const annuity = i > 0 ? (growth - 1) / i : months;
  return Math.max(0, (target - fromEvents) / annuity);
}
