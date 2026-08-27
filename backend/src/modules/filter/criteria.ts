/**
 * Los criterios del Filtro de Seguridad.
 *
 * Este archivo ES la herramienta: todo lo demás —el cálculo, la pantalla, el
 * historial— es maquinaria alrededor de lo que aquí se declara. La idea es
 * que ajustar el criterio experto de Luifer sea editar esta lista, no tocar
 * código.
 *
 * ⚠️ LOS PESOS SON PROVISIONALES. Cuánto vale la fiducia frente a la
 * ubicación es precisamente el criterio que la herramienta pretende escalar,
 * y eso no se puede inventar: tiene que fijarlos Luifer. Los de aquí son un
 * punto de partida coherente con el avatar —que prioriza seguridad sobre
 * rentabilidad— pero son suyos, no míos.
 */

export type CategoryId = 'legal' | 'builder' | 'location' | 'financial' | 'fit';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** Cuánto pesa esta categoría en el resultado. Las cinco suman 100. */
  weight: number;
}

export const CATEGORIES: Category[] = [
  {
    id: 'legal',
    name: 'Seguridad jurídica',
    description:
      'Lo que impide que pierdas el dinero si el proyecto no se termina.',
    weight: 35,
  },
  {
    id: 'builder',
    name: 'Solidez del constructor',
    description: 'Quién construye, y qué ha hecho antes.',
    weight: 25,
  },
  {
    id: 'location',
    name: 'Ubicación y demanda',
    description: 'Si la zona ya vale o solo promete valer.',
    weight: 15,
  },
  {
    id: 'financial',
    name: 'Estructura financiera',
    description: 'El precio, la forma de pago y lo que no está en el folleto.',
    weight: 15,
  },
  {
    id: 'fit',
    name: 'Coherencia contigo',
    description: 'Si este proyecto cabe en tu vida, no solo en tu entusiasmo.',
    weight: 10,
  },
];

export interface Choice {
  value: string;
  label: string;
  /** 0 a 100. */
  score: number;
}

export interface Criterion {
  id: string;
  category: CategoryId;
  question: string;
  /** Cómo averiguarlo, para quien no sepa la respuesta. */
  help: string;
  /** Peso dentro de su categoría. */
  weight: number;
  /**
   * Eliminatorio: si sale mal, el veredicto es rojo por bueno que sea todo
   * lo demás. «Si no cumple, no entra» — no se promedia con el resto.
   */
  knockout?: boolean;
  choices: Choice[];
  /** Qué hacer cuando la respuesta es «no sé». */
  unknownAction: string;
  /** Se calcula solo a partir de los comparables, no se pregunta. */
  derived?: boolean;
}

const SI_NO = (siScore = 100, noScore = 0): Choice[] => [
  { value: 'si', label: 'Sí', score: siScore },
  { value: 'no', label: 'No', score: noScore },
];

export const CRITERIA: Criterion[] = [
  // ---------- Seguridad jurídica ----------
  {
    id: 'fiducia',
    category: 'legal',
    question: '¿El proyecto tiene fiducia inmobiliaria constituida?',
    help: 'La fiducia guarda tu dinero hasta que el proyecto alcanza el punto de equilibrio. Sin ella, le estás entregando la plata directamente al constructor.',
    weight: 35,
    knockout: true,
    choices: SI_NO(),
    unknownAction:
      'Pídele al vendedor el certificado de la fiducia y el número del encargo fiduciario.',
  },
  {
    id: 'licencia',
    category: 'legal',
    question: '¿Tiene licencia de construcción vigente?',
    help: 'Sin licencia no se puede construir, y un proyecto que vende antes de tenerla está vendiendo una intención.',
    weight: 30,
    knockout: true,
    choices: SI_NO(),
    unknownAction:
      'Pide el número de licencia y verifícalo en la Curaduría Urbana del municipio.',
  },
  {
    id: 'punto_equilibrio',
    category: 'legal',
    question: '¿Cuánto lleva vendido frente a su punto de equilibrio?',
    help: 'El punto de equilibrio es cuántas unidades tienen que venderse para que la obra arranque. Hasta llegar ahí, tu dinero sigue en la fiducia.',
    weight: 20,
    choices: [
      { value: 'superado', label: 'Ya lo superó', score: 100 },
      { value: 'cerca', label: 'Le falta poco', score: 70 },
      { value: 'lejos', label: 'Va muy por debajo', score: 25 },
      { value: 'sin_definir', label: 'No está definido', score: 0 },
    ],
    unknownAction:
      'Pregunta cuál es el punto de equilibrio en unidades y cuántas llevan vendidas hoy.',
  },
  {
    id: 'tradicion',
    category: 'legal',
    question: '¿Revisaste el certificado de tradición y libertad del lote?',
    help: 'Ahí aparece si el terreno tiene hipotecas, embargos o pleitos. Cuesta poco y se pide en línea.',
    weight: 15,
    choices: SI_NO(100, 30),
    unknownAction:
      'Pide el certificado de tradición y libertad en la Superintendencia de Notariado y Registro.',
  },

  // ---------- Solidez del constructor ----------
  {
    id: 'incumplimientos',
    category: 'builder',
    question: '¿El constructor tiene incumplimientos o pleitos conocidos?',
    help: 'Busca su nombre junto a «demanda», «incumplimiento» o «entrega tardía». Si algo salió mal antes, suele estar escrito.',
    weight: 35,
    knockout: true,
    // Invertido: aquí el «sí» es la mala noticia.
    choices: [
      { value: 'no', label: 'No encontré nada', score: 100 },
      { value: 'si', label: 'Sí, encontré casos', score: 0 },
    ],
    unknownAction:
      'Busca el nombre del constructor en internet y pregunta en grupos de compradores de la ciudad.',
  },
  {
    id: 'entregados',
    category: 'builder',
    question: '¿Cuántos proyectos ha entregado ya?',
    help: 'Entregado es distinto de vendido. Un constructor que nunca ha entregado nada todavía no ha demostrado que puede.',
    weight: 30,
    choices: [
      { value: 'muchos', label: 'Más de tres', score: 100 },
      { value: 'algunos', label: 'Entre uno y tres', score: 65 },
      { value: 'ninguno', label: 'Ninguno todavía', score: 15 },
    ],
    unknownAction:
      'Pide la lista de proyectos entregados con direcciones, y visita alguno.',
  },
  {
    id: 'anios',
    category: 'builder',
    question: '¿Cuántos años lleva construyendo?',
    help: 'Los años solos no bastan, pero una empresa recién creada para este proyecto es una señal distinta a una con historia.',
    weight: 20,
    choices: [
      { value: 'mas_diez', label: 'Más de diez', score: 100 },
      { value: 'tres_diez', label: 'Entre tres y diez', score: 70 },
      { value: 'menos_tres', label: 'Menos de tres', score: 30 },
    ],
    unknownAction:
      'Consulta el certificado de existencia y representación legal en la Cámara de Comercio.',
  },
  {
    id: 'respaldo',
    category: 'builder',
    question: '¿Pudiste verificar su respaldo financiero?',
    help: 'Estados financieros, el banco que lo respalda, o la aseguradora que ampara el proyecto.',
    weight: 15,
    choices: SI_NO(100, 40),
    unknownAction:
      'Pregunta qué banco financia la obra y qué póliza ampara el cumplimiento.',
  },

  // ---------- Ubicación y demanda ----------
  {
    id: 'valorizacion',
    category: 'location',
    question: '¿La zona ya se valorizó o apenas lo promete?',
    help: 'Una zona con obras terminadas y precios que subieron es distinta de una donde «va a pasar de todo».',
    weight: 40,
    choices: [
      {
        value: 'comprobada',
        label: 'Ya subió, hay con qué compararlo',
        score: 100,
      },
      {
        value: 'en_curso',
        label: 'Hay obras en marcha, todavía no se refleja',
        score: 70,
      },
      { value: 'promesa', label: 'Todo es promesa a futuro', score: 25 },
    ],
    unknownAction:
      'Compara precios de venta de la zona hace tres años contra los de hoy.',
  },
  {
    id: 'absorcion',
    category: 'location',
    question: '¿Cómo se está vendiendo el proyecto?',
    help: 'Si lleva meses estancado, el mercado ya opinó sobre el precio.',
    weight: 35,
    choices: [
      { value: 'rapido', label: 'Se está vendiendo rápido', score: 100 },
      { value: 'normal', label: 'Va a ritmo normal', score: 70 },
      { value: 'estancado', label: 'Lleva meses sin moverse', score: 25 },
    ],
    unknownAction:
      'Pregunta cuántas unidades quedan y desde cuándo está abierta la venta.',
  },
  {
    id: 'infraestructura',
    category: 'location',
    question: '¿Qué hay alrededor?',
    help: 'Vías, transporte, comercio, colegios. Lo que hace que alguien quiera vivir ahí o pagar arriendo.',
    weight: 25,
    choices: [
      { value: 'consolidada', label: 'Todo consolidado', score: 100 },
      { value: 'creciendo', label: 'En construcción', score: 65 },
      { value: 'aislada', label: 'Todavía no hay nada', score: 25 },
    ],
    unknownAction: 'Ve al lote un día entre semana y otro un domingo.',
  },

  // ---------- Estructura financiera ----------
  {
    id: 'precio_m2',
    category: 'financial',
    question: 'Precio por metro cuadrado frente a la zona',
    help: 'Se calcula solo con los comparables que agregues abajo.',
    weight: 45,
    derived: true,
    choices: [
      { value: 'bajo', label: 'Por debajo del mercado', score: 100 },
      { value: 'mercado', label: 'En precio de mercado', score: 60 },
      { value: 'alto', label: 'Por encima del mercado', score: 15 },
    ],
    unknownAction:
      'Agrega al menos dos comparables de la zona para poder calcularlo.',
  },
  {
    id: 'forma_pago',
    category: 'financial',
    question: '¿La cuota inicial se paga durante la construcción?',
    help: 'Pagarla en cuotas mientras se construye es lo que hace que se pueda comprar sin tener el dinero completo hoy.',
    weight: 30,
    choices: SI_NO(100, 45),
    unknownAction: 'Pide el plan de pagos escrito, con fechas y montos.',
  },
  {
    id: 'costos_ocultos',
    category: 'financial',
    question:
      '¿Sabes cuánto va a costar la administración y qué cuotas extraordinarias se proyectan?',
    help: 'Una administración alta se come el arriendo. Y en proyectos nuevos suele haber cuotas extra al inicio.',
    weight: 25,
    choices: SI_NO(100, 35),
    unknownAction:
      'Pide el presupuesto de administración proyectado y el reglamento de propiedad horizontal.',
  },

  // ---------- Coherencia contigo ----------
  {
    id: 'cuota_mensual',
    category: 'fit',
    question: '¿La cuota mensual cabe en tu presupuesto sin apretarte?',
    help: 'Si para pagarla tienes que dejar de hacer cosas que hoy haces, el proyecto es más grande que tú.',
    weight: 45,
    choices: [
      { value: 'holgado', label: 'Cabe con holgura', score: 100 },
      { value: 'justo', label: 'Cabe justo', score: 55 },
      { value: 'apretado', label: 'Tendría que apretarme', score: 10 },
    ],
    unknownAction:
      'Suma tus gastos fijos de un mes y réstalos de tus ingresos antes de decidir.',
  },
  {
    id: 'sostenibilidad',
    category: 'fit',
    question: '¿Podrías sostener los pagos si tus ingresos bajaran unos meses?',
    help: 'La obra tarda años. En ese tiempo cambian los trabajos, los negocios y la salud.',
    weight: 35,
    choices: SI_NO(100, 25),
    unknownAction:
      'Calcula cuántos meses de cuota podrías pagar con tus ahorros actuales.',
  },
  {
    id: 'proposito',
    category: 'fit',
    question: '¿Tienes claro para qué lo compras?',
    help: 'Arrendarlo, venderlo, vivir en él. Cada propósito exige cosas distintas del inmueble.',
    weight: 20,
    choices: [
      { value: 'claro', label: 'Sí, y sé qué necesita para eso', score: 100 },
      { value: 'mas_o_menos', label: 'Más o menos', score: 50 },
      { value: 'no', label: 'Todavía no', score: 20 },
    ],
    unknownAction:
      'Antes de seguir, define si es para arrendar, para vender o para vivir.',
  },
];

export const criterionById = (id: string) =>
  CRITERIA.find((criterion) => criterion.id === id);
