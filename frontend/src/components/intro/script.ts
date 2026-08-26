/**
 * Guion de la Secuencia de Apertura — concepto "El Contador".
 *
 * El golpe de la pieza es un contraste de cifras: una real y fea (lo que el
 * sistema pensional entrega al final de una vida laboral) contra una
 * construida (lo que deja una propiedad bien estructurada). Las cifras viven
 * acá, separadas de la animación, para que Luifer las valide y las ajuste sin
 * que nadie tenga que tocar el componente.
 */

export const FIGURES = {
  /** Días ya cotizados por el perfil de referencia — 12 años exactos. */
  daysWorked: 4380,
  /** Días que le faltan hasta la edad de pensión — 17 años exactos. */
  daysRemaining: 6205,
  /** Semanas que exige el sistema colombiano a un hombre. */
  weeksRequired: 1300,
  /**
   * Mesada mensual de referencia.
   * ⚠️ Pendiente de validar con Luifer antes de publicar: es una afirmación
   * de hecho sobre el sistema pensional, no una proyección de nuestro producto.
   */
  monthlyPension: 1_400_000,
  /**
   * Renta mensual de cada unidad del beat de multiplicación, en el orden de
   * la rejilla. Son distintas a propósito: cifras idénticas se leen como una
   * plantilla, y variadas se leen como propiedades reales distintas.
   *
   * ⚠️ Son las cifras de mayor exposición de toda la pieza: proyecciones de
   * ingreso mostradas en pantalla. Deben ir firmadas por Luifer y, muy
   * probablemente, acompañadas de una nota de "resultados no garantizados"
   * antes de publicar. Debe haber tantas como celdas tenga la rejilla.
   */
  monthlyIncomes: [2_150_000, 2_480_000, 2_900_000, 3_250_000],
} as const;

export type Scene =
  | "gate"
  | "worked"
  | "remaining"
  | "pension"
  | "break"
  | "plan"
  | "build"
  | "multiply"
  | "promise"
  | "brand";

type Beat = {
  scene: Scene;
  /** Duración de la escena. `null` = espera al usuario (última escena). */
  ms: number | null;
};

/** Tiempos de escritorio. En móvil se comprimen con MOBILE_FACTOR. */
export const SCRIPT: readonly Beat[] = [
  { scene: "worked", ms: 2900 },
  { scene: "remaining", ms: 3200 },
  { scene: "pension", ms: 3200 },
  { scene: "break", ms: 1800 }, // el quiebre dura 1100ms: el resto es silencio
  { scene: "plan", ms: 3600 }, // se traza la planta
  { scene: "build", ms: 4200 }, // la planta se estructura en volumen
  { scene: "multiply", ms: 4400 }, // la unidad se repite y rinde
  { scene: "promise", ms: 2500 },
  { scene: "brand", ms: null },
] as const;

/**
 * En móvil está el grueso del tráfico y la paciencia es menor: la misma
 * narrativa en ~10 s en vez de ~16 s.
 */
export const MOBILE_FACTOR = 0.65;

/** Versionada: si el guion cambia, la secuencia vuelve a correr una vez. */
export const SEEN_KEY = "luifer:intro:v6";

export const COPY = {
  gateTitle: "Pulsa para continuar",
  gateHint: "[ con sonido — el contador ya está corriendo ]",
  skip: "Ir directo",
  mute: "Silenciar",
  unmute: "Activar sonido",
  worked: "Llevas 4.380 días trabajando.",
  remaining: "Te faltan",
  remainingTail: "más.",
  pension: "Y al final, el sistema te va a pagar",
  pensionTail: "al mes.",
  plan: "Hay otra forma de pensionarse.",
  build: "Una que se planea antes de construirse.",
  multiply: "Y lo que funciona una vez, se repite con el mismo método.",
  promise: "Un patrimonio que no depende de que sigas trabajando.",
  brand: "Pensionate con Bienes Raíces",
  cta: "Conocer mi Índice de Blindaje",
  ctaNote: "Toma 5 minutos. No necesitas preparar nada.",
} as const;
