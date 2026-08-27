/**
 * El motor del Filtro de Seguridad.
 *
 * Tres reglas lo gobiernan, y las tres son decisiones de producto, no
 * detalles técnicos:
 *
 * 1. «No sé» no es cero. Castigar a alguien por no saber si el proyecto
 *    tiene fiducia sería confundir ignorancia con riesgo. Lo que baja es la
 *    CONFIANZA del resultado, y cada hueco genera un paso concreto para
 *    llenarlo. Un 85 con 40% de confianza no es un 85.
 *
 * 2. Hay criterios eliminatorios. Un proyecto sin fiducia no puede salir
 *    verde por bueno que sea todo lo demás; promediarlo con la ubicación
 *    sería esconder justamente lo que hace perder el dinero.
 *
 * 3. Sin confianza suficiente no hay veredicto. Por debajo del umbral, la
 *    herramienta no dice «seguro» ni «riesgoso»: dice que faltan datos. Un
 *    semáforo verde sobre tres respuestas sería peor que no dar ninguno.
 */
import {
  CATEGORIES,
  CRITERIA,
  type CategoryId,
  type Criterion,
} from './criteria';

/** Por debajo de esto no se emite veredicto, solo se piden datos. */
export const MIN_CONFIDENCE = 60;

export const THRESHOLDS = { verde: 75, amarillo: 50 } as const;

export type Verdict = 'verde' | 'amarillo' | 'rojo' | 'sin_datos';

export interface Answers {
  [criterionId: string]: string | undefined;
}

export interface CategoryScore {
  id: CategoryId;
  name: string;
  weight: number;
  /** `null` si no se contestó nada de esta categoría. */
  score: number | null;
  answered: number;
  total: number;
}

export interface Alert {
  criterionId: string;
  question: string;
  severity: 'critica' | 'atencion';
  message: string;
}

export interface NextStep {
  criterionId: string;
  action: string;
}

export interface Evaluation {
  score: number | null;
  confidence: number;
  verdict: Verdict;
  label: string;
  summary: string;
  categories: CategoryScore[];
  alerts: Alert[];
  nextSteps: NextStep[];
}

function scoreOf(criterion: Criterion, value: string | undefined) {
  if (value === undefined) return null;
  return criterion.choices.find((c) => c.value === value)?.score ?? null;
}

export function evaluate(answers: Answers): Evaluation {
  const categories: CategoryScore[] = [];
  const alerts: Alert[] = [];
  const nextSteps: NextStep[] = [];
  let knocked = false;

  for (const category of CATEGORIES) {
    const criteria = CRITERIA.filter((c) => c.category === category.id);
    let weighted = 0;
    let weightUsed = 0;
    let answered = 0;

    for (const criterion of criteria) {
      const value = answers[criterion.id];
      const score = scoreOf(criterion, value);

      if (score === null) {
        // El hueco no puntúa: se convierte en un paso a dar.
        nextSteps.push({
          criterionId: criterion.id,
          action: criterion.unknownAction,
        });
        continue;
      }

      answered += 1;
      weighted += score * criterion.weight;
      weightUsed += criterion.weight;

      if (criterion.knockout && score === 0) {
        knocked = true;
        alerts.push({
          criterionId: criterion.id,
          question: criterion.question,
          severity: 'critica',
          message: criterion.unknownAction,
        });
      } else if (score <= 30) {
        alerts.push({
          criterionId: criterion.id,
          question: criterion.question,
          severity: 'atencion',
          message: criterion.unknownAction,
        });
      }
    }

    categories.push({
      id: category.id,
      name: category.name,
      weight: category.weight,
      score: weightUsed > 0 ? Math.round(weighted / weightUsed) : null,
      answered,
      total: criteria.length,
    });
  }

  // La confianza es qué parte del peso total quedó realmente contestada.
  const totalWeight = CATEGORIES.reduce(
    (sum, category) =>
      sum +
      CRITERIA.filter((c) => c.category === category.id).reduce(
        (inner, criterion) =>
          inner + (criterion.weight * category.weight) / 100,
        0,
      ),
    0,
  );
  const answeredWeight = CRITERIA.reduce((sum, criterion) => {
    if (scoreOf(criterion, answers[criterion.id]) === null) return sum;
    const category = CATEGORIES.find((c) => c.id === criterion.category)!;
    return sum + (criterion.weight * category.weight) / 100;
  }, 0);
  const confidence = Math.round((answeredWeight / totalWeight) * 100);

  // El resultado global pondera por categoría, contando solo las que
  // tienen alguna respuesta: una categoría en blanco no puede arrastrar.
  const scored = categories.filter((c) => c.score !== null);
  const score =
    scored.length === 0
      ? null
      : Math.round(
          scored.reduce((sum, c) => sum + c.score! * c.weight, 0) /
            scored.reduce((sum, c) => sum + c.weight, 0),
        );

  const verdict = decide(score, confidence, knocked);

  return {
    score,
    confidence,
    verdict,
    ...describe(verdict, confidence, knocked),
    categories,
    alerts,
    nextSteps,
  };
}

function decide(
  score: number | null,
  confidence: number,
  knocked: boolean,
): Verdict {
  // Lo eliminatorio manda incluso sobre la falta de datos: si ya sabemos que
  // no tiene fiducia, no hace falta responder nada más para saber que no.
  if (knocked) return 'rojo';
  if (score === null || confidence < MIN_CONFIDENCE) return 'sin_datos';
  if (score >= THRESHOLDS.verde) return 'verde';
  if (score >= THRESHOLDS.amarillo) return 'amarillo';
  return 'rojo';
}

function describe(verdict: Verdict, confidence: number, knocked: boolean) {
  if (knocked) {
    return {
      label: 'No entra',
      summary:
        'Falló algo que no se compensa con el resto. Por bueno que sea todo lo demás, este proyecto no pasa el filtro.',
    };
  }
  switch (verdict) {
    case 'verde':
      return {
        label: 'Seguro para avanzar',
        summary:
          'No aparecieron señales de alarma. Revisa igual los pasos pendientes antes de firmar.',
      };
    case 'amarillo':
      return {
        label: 'Requiere revisión',
        summary:
          'Hay cosas que no cuadran del todo. No es un no, pero tampoco es un sí hasta que las resuelvas.',
      };
    case 'rojo':
      return {
        label: 'Alto riesgo',
        summary:
          'Demasiadas señales en contra. Si decides seguir, que sea sabiendo exactamente cuáles.',
      };
    default:
      return {
        label: 'Faltan datos',
        summary: `Con ${confidence}% de la evaluación contestada no se puede dar un veredicto. Los pasos de abajo son lo que falta por averiguar.`,
      };
  }
}

/** Traduce la comparación de precio a la respuesta del criterio derivado. */
export function pricingChoice(
  listedPrice: number,
  marketValue: number,
): string {
  if (listedPrice <= marketValue * 0.95) return 'bajo';
  if (listedPrice <= marketValue * 1.02) return 'mercado';
  return 'alto';
}
