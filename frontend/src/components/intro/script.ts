/**
 * Guion de la Secuencia de Apertura — cuatro actos.
 *
 * ACTO 1  El Día 30. Un $ llega y los gastos se lo comen. Tres veces, cada
 *         una más rápida: la aceleración es lo que produce la sensación de
 *         trampa — el espectador ya sabe cómo termina antes de que termine.
 * ACTO 2  La pensión es el mismo Día 30, solo que más tarde. Mismo $, misma
 *         tipografía, misma posición, misma erosión.
 * RUPTURA Un segundo de silencio absoluto. Es el efecto más potente de la
 *         pieza y no cuesta nada.
 * ACTO 3  El plano. Cambio de paleta: del gris frío al azul de arquitectura.
 *         Aquí se muestra el método, no el resultado.
 * ACTO 4  Se repite. Y el Día 30 vuelve — mismo símbolo, mismo lugar, mismos
 *         gastos llegando — pero esta vez aguanta.
 *
 * Las cifras viven acá, separadas de la animación, para que Luifer las valide
 * sin que nadie tenga que tocar un componente.
 */

export const FIGURES = {
  /** Días ya cotizados por el perfil de referencia — 12 años exactos. */
  daysWorked: 4380,
  /** Días que le faltan hasta la edad de pensión — 17 años exactos. */
  daysRemaining: 6205,
  /** Semanas que exige el sistema colombiano a un hombre. */
  weeksRequired: 1300,
  /** Semanas cotizadas del perfil de referencia. */
  weeksPaid: 412,

  /**
   * Caso documentado del Acto 3.
   * ⚠️ Son las únicas cifras de dinero de toda la pieza y afirman un
   * resultado real. Deben corresponder a una operación que Luifer pueda
   * mostrar completa en el webinar — el rótulo al pie lo promete
   * explícitamente. Si el caso cambia, cambian estas cuatro líneas.
   */
  listedPrice: 420_000_000,
  adjustedPrice: 381_000_000,
  maxPrice: 347_500_000,
  gain: 34_000_000,
  gainMonths: 3,
} as const;

/**
 * Ganancia de cada unidad en la rejilla del Acto 4, en el orden de la
 * cuadrícula. La primera es la del caso documentado que acaba de mostrarse en
 * el Acto 3 — así la rejilla arranca de algo que el espectador ya vio, y no de
 * ocho cifras que aparecen de la nada.
 *
 * ⚠️ Ocho ganancias en pantalla es una afirmación mucho mayor que un caso
 * único. El rótulo del Acto 3 se mantiene visible durante el Acto 4 por eso
 * mismo. Deben corresponder a operaciones que Luifer pueda sustentar, o
 * reemplazarse por el "+$" sin cifra que llevaba antes.
 */
export const UNIT_GAINS = [
  34_000_000, // el caso del Acto 3
  42_000_000,
  61_000_000,
  38_500_000,
  47_000_000,
  64_500_000,
  43_800_000,
  58_000_000,
] as const;

/** Gastos que llegan por la izquierda y se comen el $. Uno por franja. */
export const EXPENSES = [
  "arriendo",
  "servicios",
  "mercado",
  "transporte",
  "deudas",
  "cuotas",
] as const;

/** Comparables del Acto 3. En móvil solo se muestran los dos primeros. */
export const COMPARABLES = [
  { label: "Torre Aralia · 78 m²", perM2: 4_950_000 },
  { label: "Cll 12 #4-30 · 84 m²", perM2: 4_780_000 },
  { label: "Miramonte · 71 m²", perM2: 4_610_000 },
  { label: "Portal Sur · 80 m²", perM2: 4_540_000 },
] as const;

/** Costos que empujan el precio hacia abajo. */
export const COSTS = ["escrituración", "impuestos", "adecuaciones"] as const;

/**
 * Los ocho pasos del método. Solo tres se encienden en la pieza.
 * ⚠️ Los cinco sin nombre quedan como nodos apagados a propósito: no me
 * corresponde inventarle los pasos al método de Luifer. Cuando los defina,
 * se escriben acá y la línea los muestra sin tocar el componente.
 */
export const METHOD_STEPS = [
  { name: "buscar", lit: true },
  { name: "analizar", lit: true },
  { name: "negociar", lit: true },
  { name: null, lit: false },
  { name: null, lit: false },
  { name: null, lit: false },
  { name: null, lit: false },
  { name: null, lit: false },
] as const;

export type Scene =
  | "gate"
  // Acto 1 — el Día 30
  | "worked"
  | "remaining"
  | "payday"
  | "drain"
  | "zero"
  | "cycle2"
  | "cycle3"
  // Acto 2 — la pensión es el mismo Día 30
  | "weeks"
  | "jump"
  | "pension"
  | "pensionZero"
  | "verdict"
  // Ruptura
  | "rupture"
  // Acto 3 — el plano
  | "other"
  | "plan"
  | "lift"
  | "listed"
  | "comps"
  | "costs"
  | "material"
  // Acto 4 — se repite
  | "repeat"
  | "method"
  | "hold"
  | "brand";

/** En qué acto vive cada escena. Decide la paleta y el ambiente sonoro. */
export type Act = 1 | 2 | 3 | 4;

type Beat = {
  scene: Scene;
  /** Duración de la escena. `null` = espera al usuario (última escena). */
  ms: number | null;
  act: Act;
  /** Se omite en móvil, donde la pieza se recorta a ~28 s. */
  skipOnMobile?: boolean;
};

export const SCRIPT: readonly Beat[] = [
  // ---- ACTO 1 ----
  { scene: "worked", ms: 2500, act: 1 },
  { scene: "remaining", ms: 3400, act: 1 }, // la frase creció
  { scene: "payday", ms: 1700, act: 1 },
  { scene: "drain", ms: 5200, act: 1 },
  { scene: "zero", ms: 1700, act: 1 },
  { scene: "cycle2", ms: 2500, act: 1 },
  { scene: "cycle3", ms: 1300, act: 1, skipOnMobile: true },
  // ---- ACTO 2 ----
  { scene: "weeks", ms: 3400, act: 2 },
  { scene: "jump", ms: 2400, act: 2 },
  { scene: "pension", ms: 2800, act: 2 },
  { scene: "pensionZero", ms: 1700, act: 2 },
  { scene: "verdict", ms: 3400, act: 2 }, // 88 caracteres que hay que leer
  // ---- RUPTURA · el silencio ----
  { scene: "rupture", ms: 1200, act: 2 },
  // ---- ACTO 3 ----
  { scene: "other", ms: 3000, act: 3 }, // se escribe a máquina: 2.6 s
  { scene: "plan", ms: 4000, act: 3 },
  { scene: "lift", ms: 4000, act: 3 },
  { scene: "listed", ms: 1700, act: 3 },
  { scene: "comps", ms: 3200, act: 3 },
  { scene: "costs", ms: 2500, act: 3 },
  { scene: "material", ms: 3200, act: 3 },
  // ---- ACTO 4 ----
  { scene: "repeat", ms: 4000, act: 4 },
  { scene: "method", ms: 2600, act: 4 },
  { scene: "hold", ms: 5000, act: 4 },
  { scene: "brand", ms: null, act: 4 },
] as const;

/** Orden narrativo, para poder preguntar "¿ya pasamos por acá?". */
export const ORDER: readonly Scene[] = [
  "gate",
  ...SCRIPT.map((b) => b.scene),
];

/**
 * En móvil está el grueso del tráfico y la paciencia es menor: la misma
 * narrativa en ~28 s. Además de comprimir tiempos se recorta estructura —
 * un ciclo menos en el Acto 1, dos comparables en vez de cuatro y cuatro
 * unidades en vez de ocho.
 */
export const MOBILE_FACTOR = 0.52;
/**
 * Escenas donde los gastos desfilan. La duración de cada desfile sale del
 * propio beat, no de una tabla aparte: si un beat se alarga, el sonido y la
 * erosión se alargan con él sin que haya que acordarse de dos sitios.
 */
export const DRAIN_SCENES: readonly Scene[] = [
  "drain",
  "cycle2",
  "cycle3",
  "pension",
];

export const MOBILE_COMPARABLES = 2;
export const MOBILE_UNITS = 4;
export const DESKTOP_UNITS = 8;

/** Versionada: si el guion cambia, la secuencia vuelve a correr una vez. */
export const SEEN_KEY = "luifer:intro:v15";

export const COPY = {
  gateTitle: "Pulsa para continuar",
  gateHint: "[ el sistema necesita tu permiso para hablar ]",
  skip: "Saltar",
  mute: "Silenciar",
  unmute: "Activar sonido",

  worked: "Llevas 4.380 días trabajando.",
  remaining: "Y el sistema no te suelta hasta dentro de",
  remainingTail: "más.",
  payday: "Día 30. El sistema te paga.",
  paydayShort: "Día 30.",

  weeks: "semanas cotizadas",
  jump: "Y cuando por fin lleguen las 1.300…",
  pension: "PENSIÓN",
  /**
   * El giro del Acto 2. No es que el sistema pague poco: es que cobra los
   * años en que uno todavía puede disfrutarlo. Ahí está la diferencia entre
   * pensionarse y pensionarse temprano.
   */
  verdict:
    "El sistema no tiene otro final. Tiene el mismo — y te cobra tus mejores años por llegar.",

  other: "Hay otra forma. Y no te pide esperar toda la vida.",
  /**
   * Las dos líneas del trazado. La primera señala lo que hay en pantalla y le
   * da la vuelta: no es que falte todo por construir, es que ese dibujo ya
   * vale — y a su precio más bajo. La segunda dice dónde está la ganancia: no
   * en vender después, sino en que la valorización de la obra le pertenece a
   * quien entró primero.
   *
   * Ninguna promete una cifra ni un porcentaje: describen a quién le
   * corresponde la valorización, no cuánta va a ser.
   */
  planCaption:
    "Este dibujo ya tiene precio. Y es el más bajo del proyecto: la lista 0.",
  liftCaption:
    "Se valoriza mientras se levanta. Y esa valorización es de quien compró primero.",
  listed: "precio publicado",
  compsLead: "lo que se está pagando en la zona",
  adjusted: "precio ajustado a mercado",
  maxPrice: "tu precio máximo",
  gain: "en 3 meses",
  disclaimer: "caso documentado · los números completos en el minuto 45",
  thesis: "Eso no se ganó vendiendo. Se ganó comprando.",

  repeat: "Y se repite.",
  /**
   * El remate, justo cuando el $ aguanta por primera vez. Es donde aterriza
   * «temprano»: no se afirma ninguna edad, se afirma que la espera no era
   * necesaria.
   */
  holdLine: "Y no tuviste que esperar a envejecer.",
  method: "MÉTODO GANAR AL COMPRAR",
  brand: "Pensionate joven con Bienes Raíces",
  tagline:
    "La libertad no llega con la edad. Llega cuando el ingreso deja de depender de ti.",
  cta: "Entrar",
} as const;
