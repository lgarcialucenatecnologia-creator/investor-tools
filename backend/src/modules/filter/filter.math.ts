/**
 * El método «Ganar al Comprar», como cálculo.
 *
 * Es el mismo recorrido que muestra el Acto 3 de la Secuencia de Apertura:
 *
 *   precio publicado
 *        ↓  comparables de la zona
 *   valor de mercado
 *        ↓  costos de entrada + margen
 *   tu precio máximo
 *
 * Cada paso queda registrado para poder explicarlo: un veredicto sin las
 * razones escritas no sirve para decidir, y el producto entero existe para
 * que alguien deje de suponer.
 */

export interface Comparable {
  reference: string;
  areaM2: number;
  price: number;
}

export interface FilterInput {
  listedPrice: number;
  areaM2: number;
  comparables: Comparable[];
  /** Porcentaje sobre el valor de mercado. */
  deedCostRate: number;
  taxRate: number;
  /** Monto fijo: reparaciones, pintura, lo que haya que dejar listo. */
  refurbishCost: number;
  /** Cuánto por debajo del mercado hay que comprar para que valga la pena. */
  safetyMarginRate: number;
}

export interface FilterResult {
  /** Mediana de $/m² de los comparables. */
  medianPricePerM2: number;
  marketValue: number;
  /** Diferencia entre lo que piden y lo que vale. Negativo = piden de más. */
  listedVsMarket: number;
  deedCost: number;
  taxCost: number;
  refurbishCost: number;
  entryCosts: number;
  safetyMargin: number;
  maxPrice: number;
  /** Lo que se gana al comprar, si se compra al máximo. */
  gainAtMaxPrice: number;
  passes: boolean;
}

/**
 * Mediana y no promedio: un solo comparable disparatado —el vecino que pide
 * el doble— arrastra el promedio y no la mediana. En muestras de tres o
 * cuatro, que es lo normal, la diferencia decide el veredicto.
 */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function runFilter(input: FilterInput): FilterResult {
  const pricesPerM2 = input.comparables.map((c) => c.price / c.areaM2);
  const medianPricePerM2 = median(pricesPerM2);
  const marketValue = medianPricePerM2 * input.areaM2;

  const deedCost = marketValue * input.deedCostRate;
  const taxCost = marketValue * input.taxRate;
  const entryCosts = deedCost + taxCost + input.refurbishCost;
  const safetyMargin = marketValue * input.safetyMarginRate;

  const maxPrice = marketValue - entryCosts - safetyMargin;

  return {
    medianPricePerM2: round(medianPricePerM2),
    marketValue: round(marketValue),
    listedVsMarket: round(marketValue - input.listedPrice),
    deedCost: round(deedCost),
    taxCost: round(taxCost),
    refurbishCost: round(input.refurbishCost),
    entryCosts: round(entryCosts),
    safetyMargin: round(safetyMargin),
    maxPrice: round(maxPrice),
    gainAtMaxPrice: round(marketValue - maxPrice - entryCosts),
    // Al peso: comparar decimales de coma flotante haría que un proyecto
    // pedido exactamente al máximo saliera rechazado por un céntimo.
    passes: Math.round(input.listedPrice) <= Math.round(maxPrice),
  };
}

const round = (value: number) => Math.round(value);
