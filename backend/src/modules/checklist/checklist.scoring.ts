/**
 * El cálculo del Check List.
 *
 * Tres reglas de producto lo gobiernan:
 *
 * 1. Lo que no se ha calificado no es cero. Baja la COBERTURA del resultado;
 *    no castiga al proyecto por algo que todavía no averiguaste.
 *
 * 2. Lo eliminatorio manda. Sin fiduciaria el proyecto no pasa, por buen
 *    promedio que tenga el resto.
 *
 * 3. Sin cobertura suficiente no hay veredicto. Un «proyecto sólido» sobre
 *    cuatro ítems calificados sería peor que no decir nada.
 *
 * La escala 1–5 se traduce a 0–100 con (n − 1) / 4: un 1 significa «juega
 * en contra», y mostrarlo como 20% le daría un puntaje que no merece.
 */
import {
  KNOCKOUT_MAX_RATING,
  SECTIONS,
  itemsFor,
  type ProjectType,
} from './checklist.criteria';

/** Por debajo de esta cobertura no se emite veredicto. */
export const MIN_COVERAGE = 60;

export const THRESHOLDS = { solido: 75, revisar: 50 } as const;

export type ChecklistStatus =
  'sin_evaluar' | 'incompleto' | 'solido' | 'revisar' | 'debil' | 'no_pasa';

export type Ratings = Record<string, number | undefined>;

export interface SectionResult {
  id: string;
  name: string;
  weight: number;
  /** 0–100 sobre lo calificado; `null` si no hay nada calificado. */
  score: number | null;
  evaluated: number;
  total: number;
}

export interface WeakItem {
  itemId: string;
  title: string;
  sectionName: string;
  rating: number;
  knockout: boolean;
}

export interface ChecklistEvaluation {
  /** 0–100 sobre lo calificado; `null` si no hay nada calificado. */
  score: number | null;
  /** Qué parte del peso total ya está calificada, 0–100. */
  coverage: number;
  evaluated: number;
  total: number;
  status: ChecklistStatus;
  label: string;
  summary: string;
  sections: SectionResult[];
  /** Ítems calificados con 1 o 2: lo que hay que revisar antes de firmar. */
  weakItems: WeakItem[];
}

/** Una calificación válida es un entero de 1 a 5; lo demás no cuenta. */
export function validRating(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

const toScore = (rating: number) => ((rating - 1) / 4) * 100;

export function evaluate(
  type: ProjectType,
  ratings: Ratings,
): ChecklistEvaluation {
  const sections: SectionResult[] = [];
  const weakItems: WeakItem[] = [];
  let knocked = false;
  let evaluated = 0;
  let total = 0;
  let coveredWeight = 0;

  for (const section of SECTIONS) {
    const items = itemsFor(section, type);
    // Los pesos se reparten entre los ítems que aplican: si un ítem no aplica
    // a este tipo de proyecto, su peso no se pierde, se redistribuye.
    const sectionItemWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let weighted = 0;
    let weightUsed = 0;
    let sectionEvaluated = 0;

    for (const item of items) {
      const rating = ratings[item.id];
      if (!validRating(rating)) continue;

      sectionEvaluated += 1;
      weighted += toScore(rating) * item.weight;
      weightUsed += item.weight;

      const isKnockout = Boolean(item.knockout);
      if (isKnockout && rating <= KNOCKOUT_MAX_RATING) knocked = true;
      if (rating <= 2) {
        weakItems.push({
          itemId: item.id,
          title: item.title,
          sectionName: section.name,
          rating,
          knockout: isKnockout,
        });
      }
    }

    evaluated += sectionEvaluated;
    total += items.length;
    if (sectionItemWeight > 0) {
      coveredWeight += (section.weight * weightUsed) / sectionItemWeight;
    }

    sections.push({
      id: section.id,
      name: section.name,
      weight: section.weight,
      score: weightUsed > 0 ? Math.round(weighted / weightUsed) : null,
      evaluated: sectionEvaluated,
      total: items.length,
    });
  }

  const totalSectionWeight = SECTIONS.reduce((sum, s) => sum + s.weight, 0);
  const coverage = Math.round((coveredWeight / totalSectionWeight) * 100);

  // El resultado pondera por sección, contando solo las que tienen algo
  // calificado: una sección en blanco no puede arrastrar el promedio.
  const scored = sections.filter((s) => s.score !== null);
  const score =
    scored.length === 0
      ? null
      : Math.round(
          scored.reduce((sum, s) => sum + s.score! * s.weight, 0) /
            scored.reduce((sum, s) => sum + s.weight, 0),
        );

  // Los eliminatorios primero: son lo que más urge revisar.
  weakItems.sort(
    (a, b) => Number(b.knockout) - Number(a.knockout) || a.rating - b.rating,
  );

  const status = decide(score, coverage, evaluated, knocked);

  return {
    score,
    coverage,
    evaluated,
    total,
    status,
    ...describe(status, coverage),
    sections,
    weakItems,
  };
}

function decide(
  score: number | null,
  coverage: number,
  evaluated: number,
  knocked: boolean,
): ChecklistStatus {
  // Lo eliminatorio manda incluso con poca cobertura: si ya sabemos que no
  // tiene fiduciaria, no hace falta calificar nada más.
  if (knocked) return 'no_pasa';
  if (evaluated === 0 || score === null) return 'sin_evaluar';
  if (coverage < MIN_COVERAGE) return 'incompleto';
  if (score >= THRESHOLDS.solido) return 'solido';
  if (score >= THRESHOLDS.revisar) return 'revisar';
  return 'debil';
}

function describe(status: ChecklistStatus, coverage: number) {
  switch (status) {
    case 'no_pasa':
      return {
        label: 'No pasa',
        summary:
          'Falló un criterio eliminatorio. Eso no se compensa con el resto: por bueno que sea todo lo demás, este proyecto no entra.',
      };
    case 'solido':
      return {
        label: 'Proyecto sólido',
        summary:
          'Los criterios críticos juegan a favor. Revisa igual los puntos débiles antes de firmar.',
      };
    case 'revisar':
      return {
        label: 'Revisa antes de avanzar',
        summary:
          'Hay puntos que no cuadran del todo. No es un no, pero tampoco es un sí hasta que los resuelvas.',
      };
    case 'debil':
      return {
        label: 'Débil para invertir',
        summary:
          'Demasiados criterios juegan en contra. Si decides seguir, que sea sabiendo exactamente cuáles.',
      };
    case 'incompleto':
      return {
        label: 'Evaluación incompleta',
        summary: `Llevas ${coverage}% del peso calificado. Completa los criterios que faltan para tener un veredicto.`,
      };
    default:
      return {
        label: 'Sin evaluar',
        summary:
          'Califica cada punto de 1 a 5 a medida que lo averigües. El resultado se va armando solo.',
      };
  }
}
