/**
 * Tu rango de compra.
 *
 * Es el Módulo 1 del método —«Ordena tu Dinero Antes de Invertir»— como
 * cálculo. El documento pide DOS resultados, no uno (§65): el presupuesto
 * máximo y la cuota mensual máxima. Son cosas distintas y confundirlas es
 * exactamente el error que el módulo busca evitar.
 */

export interface StartingPoint {
  /** Lo que tiene hoy para poner. */
  availableCash: number;
  /**
   * Lo que NO va a comprometer. El §66 es explícito: «no utilizar todo el
   * dinero disponible». Debe quedar para imprevistos, retrasos, gastos,
   * cuota, adecuaciones y cambios de escenario.
   */
  safetyReserve: number;
  /** Lo que le queda libre cada mes, antes de restar obligaciones. */
  monthlyIncome: number;
  /** Lo que ya está comprometido cada mes. */
  monthlyObligations: number;
  /** Crédito que cree que puede conseguir. Cero si no lo ha averiguado. */
  possibleCredit: number;
}

export interface Alert {
  severity: 'critica' | 'atencion';
  message: string;
}

export interface BuyingRange {
  /** Lo que de verdad puede poner de su bolsillo. */
  forOperation: number;
  /** Con el crédito incluido. */
  maxBudget: number;
  /** Lo máximo que puede pagar al mes sin desorganizarse. */
  maxInstallment: number;
  /** Qué porción del dinero disponible quedó protegida. */
  reserveShare: number;
  alerts: Alert[];
}

/**
 * Plazo de referencia, en meses, para comprobar si un crédito y una cuota se
 * sostienen juntos. NO es una tasa ni una afirmación sobre ningún banco: se
 * usa solo como tope de sentido común.
 *
 * ⚠️ Ajustable. Luifer debería fijar el que use en su método.
 */
export const REFERENCE_TERM_MONTHS = 240;

export function buildRange(input: StartingPoint): BuyingRange {
  const alerts: Alert[] = [];

  // La reserva se resta ANTES de cualquier otra cosa. Es el orden del
  // método: primero se protege lo que no se toca, y con el resto se compra.
  const forOperation = Math.max(0, input.availableCash - input.safetyReserve);
  const maxBudget = forOperation + input.possibleCredit;
  const maxInstallment = Math.max(
    0,
    input.monthlyIncome - input.monthlyObligations,
  );
  const reserveShare =
    input.availableCash > 0 ? input.safetyReserve / input.availableCash : 0;

  if (input.safetyReserve <= 0) {
    alerts.push({
      severity: 'critica',
      message:
        'No dejaste reserva. El método es claro en esto: comprometer todo el dinero disponible deja la operación sin margen para un retraso, una reparación o una cuota que suba.',
    });
  }

  if (maxInstallment <= 0) {
    alerts.push({
      severity: 'critica',
      message:
        'Tus obligaciones se comen todo el ingreso mensual. Con eso no hay cuota que puedas sostener: primero hay que ordenar esa parte.',
    });
  }

  /**
   * La comprobación que evita el error más caro: pedir un crédito que la
   * cuota no aguanta.
   *
   * Se divide el crédito entre la cuota máxima, SIN intereses. Eso da el
   * suelo absoluto de meses que tardaría en pagarse. Si ese suelo ya supera
   * el plazo de referencia, con intereses es peor todavía. No hace falta
   * inventar una tasa para saber que no cuadra.
   */
  if (input.possibleCredit > 0 && maxInstallment > 0) {
    const floorMonths = Math.ceil(input.possibleCredit / maxInstallment);
    if (floorMonths > REFERENCE_TERM_MONTHS) {
      alerts.push({
        severity: 'critica',
        message: `Un crédito de ${money(input.possibleCredit)} con una cuota de ${money(maxInstallment)} tardaría al menos ${Math.round(floorMonths / 12)} años en pagarse, y eso sin contar intereses. Confírmalo con el banco antes de contar con ese monto.`,
      });
    } else if (floorMonths > REFERENCE_TERM_MONTHS * 0.75) {
      alerts.push({
        severity: 'atencion',
        message:
          'El crédito que esperas está al límite de lo que tu cuota puede sostener. Pídele al banco una preaprobación antes de buscar en ese rango.',
      });
    }
  }

  if (input.possibleCredit === 0) {
    alerts.push({
      severity: 'atencion',
      message:
        'No has puesto crédito. Si piensas usarlo, el presupuesto de arriba va a cambiar: vale la pena pedir una preaprobación antes de empezar a mirar.',
    });
  }

  return {
    forOperation: Math.round(forOperation),
    maxBudget: Math.round(maxBudget),
    maxInstallment: Math.round(maxInstallment),
    reserveShare: Math.round(reserveShare * 1000) / 1000,
    alerts,
  };
}

const money = (value: number) => `$${value.toLocaleString('es-CO')}`;
