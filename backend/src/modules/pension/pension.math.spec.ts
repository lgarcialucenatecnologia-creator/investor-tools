import {
  REFERENCE_YEARS,
  calculatePension,
  monthlyRateOf,
  type PensionInput,
} from './pension.math';

const base: PensionInput = {
  monthlyIncome: 10_000_000,
  additionalIncome: 2_000_000,
  monthlyExpenses: 8_000_000,
  expenseReduction: 1_000_000,
  goal: 'gastos',
  annualReturnRate: 0.06,
  events: [],
};

describe('calculatePension', () => {
  it('recursos para invertir = ingresos − (gastos − reducción)', () => {
    const result = calculatePension(base);
    expect(result.totalIncome).toBe(12_000_000);
    expect(result.adjustedExpenses).toBe(7_000_000);
    expect(result.monthlyInvestable).toBe(5_000_000);
  });

  it('la meta vive de las rentas: gastos ÷ tasa mensual, sin consumir capital', () => {
    const result = calculatePension(base);
    const i = monthlyRateOf(0.06);
    expect(result.targetMonthlyIncome).toBe(7_000_000);
    expect(result.targetCapital).toBe(Math.round(7_000_000 / i));
    // Las rentas de la meta pagan exactamente los gastos.
    expect(Math.round(result.targetCapital * i)).toBe(7_000_000);
  });

  it('con meta «ingreso» las rentas reemplazan todo el ingreso', () => {
    const result = calculatePension({ ...base, goal: 'ingreso' });
    expect(result.targetMonthlyIncome).toBe(12_000_000);
  });

  it('la reducción no deja los gastos por debajo de cero', () => {
    const result = calculatePension({ ...base, expenseReduction: 99_000_000 });
    expect(result.adjustedExpenses).toBe(0);
    expect(result.targetCapital).toBe(0);
    expect(result.reachedInMonths).toBeNull();
  });

  it('si el capital de hoy ya alcanza, llega en el mes 0', () => {
    const result = calculatePension({
      ...base,
      events: [{ label: 'Lote', amount: 5_000_000_000, month: 0 }],
    });
    expect(result.reachedInMonths).toBe(0);
    expect(result.progress).toBe(100);
    expect(result.gap).toBe(0);
  });

  it('un activo que se liquida más adelante adelanta la llegada', () => {
    const without = calculatePension(base).reachedInMonths!;
    const withSale = calculatePension({
      ...base,
      events: [{ label: 'Venta apto', amount: 400_000_000, month: 24 }],
    }).reachedInMonths!;
    expect(withSale).toBeLessThan(without);
  });

  it('una salida de dinero (monto negativo) la atrasa', () => {
    const without = calculatePension(base).reachedInMonths!;
    const withOutflow = calculatePension({
      ...base,
      events: [{ label: 'Universidad', amount: -150_000_000, month: 36 }],
    }).reachedInMonths!;
    expect(withOutflow).toBeGreaterThan(without);
  });

  it('si los gastos se comen el ingreso no inventa fecha de llegada', () => {
    const result = calculatePension({
      ...base,
      monthlyIncome: 5_000_000,
      additionalIncome: 0,
    });
    expect(result.monthlyInvestable).toBeLessThan(0);
    expect(result.reachedInMonths).toBeNull();
    expect(result.yearly).toHaveLength(31);
  });

  it('el aporte de referencia realmente llega a la meta en el plazo', () => {
    const scenario: PensionInput = {
      ...base,
      events: [{ label: 'Ahorros', amount: 200_000_000, month: 0 }],
    };
    const { monthlyNeededForReference, targetCapital } =
      calculatePension(scenario);

    // Se simula aportando exactamente eso: debe llegar justo en el plazo.
    const i = monthlyRateOf(scenario.annualReturnRate);
    let capital = 200_000_000;
    for (let m = 1; m <= REFERENCE_YEARS * 12; m += 1) {
      capital = capital * (1 + i) + monthlyNeededForReference;
    }
    expect(capital / targetCapital).toBeCloseTo(1, 4);
  });

  it('la proyección anual arranca hoy y cubre un par de años tras llegar', () => {
    const result = calculatePension(base);
    expect(result.yearly[0]).toEqual({ year: 0, capital: 0 });
    const reachedYear = Math.ceil(result.reachedInMonths! / 12);
    expect(result.yearly.at(-1)!.year).toBe(reachedYear + 2);
  });
});
