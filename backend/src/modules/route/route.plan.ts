/**
 * La ruta de 90 días.
 *
 * Cada tarea sale del §7 del documento del método, que define tres bloques de
 * treinta días con las etapas OPORTUNO que le corresponden. No hay tareas
 * inventadas: lo que se agregó es la redacción en imperativo y la explicación
 * de por qué importa cada una.
 *
 * ⚠️ REGLA CRÍTICA, y va visible en pantalla, no en letra chica: 90 días NO
 * significa una compra garantizada en 90 días. El propio documento lo dice en
 * mayúsculas, y la prueba antialucinación 35 lo repite: «si no compro en 90
 * días, fracasé» → NO. La meta es aprender a decidir mejor.
 */

/**
 * Cómo se comprueba que una tarea está hecha.
 *
 * Algunas se demuestran con trabajo real dentro de la plataforma y no hay que
 * marcar nada: si ya guardaste una evaluación con comparables, esa tarea está
 * hecha y punto. Es la diferencia entre avance declarado y avance demostrado.
 */
export type Evidence =
  /** Completó el Punto de Partida. */
  | 'punto-de-partida'
  /** Tiene su rango de compra, sin alertas críticas. */
  | 'rango-limpio'
  /** Guardó al menos una evaluación en el Filtro de Seguridad. */
  | 'filtro-alguna'
  /** Alguna evaluación con comparables de la zona. */
  | 'filtro-comparables'
  /** Alguna evaluación con precio máximo calculado. */
  | 'filtro-precio-maximo'
  /** Alguna evaluación cerrada con veredicto, verde o rojo. */
  | 'filtro-decidida';

export interface Task {
  id: string;
  /** Qué hacer, en imperativo. */
  label: string;
  /** Por qué importa. Sale del método, no de mi opinión. */
  why: string;
  /** Si se demuestra sola con trabajo hecho, cómo. */
  evidence?: Evidence;
}

export interface Block {
  id: string;
  order: number;
  fromDay: number;
  toDay: number;
  /** Las etapas OPORTUNO de este bloque. */
  stages: string;
  /** Qué se busca lograr, en palabras del documento. */
  goal: string;
  /** Y qué NO significa lograrlo. */
  caveat: string;
  tasks: Task[];
}

export const BLOCKS: Block[] = [
  {
    id: 'ordenar-buscar',
    order: 0,
    fromDay: 1,
    toDay: 30,
    stages: 'Ordenar + Buscar',
    goal: 'Dejar de mirar propiedades sin dirección.',
    caveat: 'No significa que a los 30 días debas haber comprado.',
    tasks: [
      {
        id: 'diagnostico',
        label: 'Completa tu Punto de Partida',
        why: 'Saber desde dónde arrancas antes de mirar una sola propiedad.',
        evidence: 'punto-de-partida',
      },
      {
        id: 'numeros',
        label: 'Organiza tus números y deja tu reserva aparte',
        why: 'El método no permite comprometer todo el dinero disponible: la reserva es para imprevistos, retrasos y cuotas.',
        evidence: 'rango-limpio',
      },
      {
        id: 'capacidad',
        label: 'Confirma tu capacidad de compra con el banco',
        why: 'Un crédito que crees que te dan no es un crédito. Sin preaprobación, tu presupuesto es un supuesto.',
      },
      {
        id: 'que-buscas',
        label: 'Define qué buscas: ciudad, sector y tipo de propiedad',
        why: 'Sin esto, cualquier propiedad parece candidata y ninguna se puede comparar con otra.',
      },
      {
        id: 'fuentes',
        label: 'Activa al menos tres fuentes de búsqueda',
        why: 'El método insiste: no depender de esperar que aparezca algo en un portal. Propietarios, agentes, constructoras, contactos, primeras listas, cesiones.',
      },
      {
        id: 'filtrar',
        label: 'Pasa tu primera propiedad por el Filtro de Seguridad',
        why: 'Filtrar es descartar rápido lo que no cumple, antes de dedicarle horas.',
        evidence: 'filtro-alguna',
      },
    ],
  },
  {
    id: 'analizar-negociar',
    order: 1,
    fromDay: 31,
    toDay: 60,
    stages: 'Analizar + Negociar',
    goal: 'Pasar de encontrar propiedades a saber cuáles vale la pena estudiar y negociar.',
    caveat:
      'Analizar bien incluye descartar. Una propiedad rechazada con números es trabajo hecho, no tiempo perdido.',
    tasks: [
      {
        id: 'comparables',
        label: 'Construye comparables de la zona para una propiedad',
        why: 'El precio publicado no es el valor. El valor justificable se defiende con comparables y ajustes.',
        evidence: 'filtro-comparables',
      },
      {
        id: 'costos',
        label: 'Suma TODOS los costos de entrada, no solo el precio',
        why: 'Escrituración, registro, impuestos, comisiones, adecuaciones. El margen tiene que sobrevivir a todos.',
      },
      {
        id: 'riesgos',
        label:
          'Revisa los riesgos: jurídicos, físicos, financieros y documentales',
        why: 'Detectar alertas antes de comprometer dinero, no después.',
      },
      {
        id: 'maximo',
        label: 'Calcula tu precio máximo antes de hablar con nadie',
        why: 'Nunca se construye una oferta sin haber definido primero el límite. Es la regla del Módulo 8.',
        evidence: 'filtro-precio-maximo',
      },
      {
        id: 'salida',
        label: 'Define la salida: quién la compraría después y a qué precio',
        why: 'La salida se piensa antes de entrar. Si no sabes a quién le vendes, no sabes qué compras.',
      },
      {
        id: 'oferta',
        label: 'Prepara una oferta con argumentos, no un número suelto',
        why: 'Una oferta sustentada en comparables y costos es más sólida que un porcentaje al azar. No existe la regla de «ofrece 20% menos».',
      },
    ],
  },
  {
    id: 'decidir-ejecutar',
    order: 2,
    fromDay: 61,
    toDay: 90,
    stages: 'Decidir + Ejecutar',
    goal: 'Poder aprobar, rechazar o seguir investigando una oportunidad con un proceso estructurado.',
    caveat:
      'Rechazar también es una decisión de inversión, y de las que protegen el dinero.',
    tasks: [
      {
        id: 'documentos',
        label: 'Reúne los documentos antes de pagar',
        why: 'Certificado de tradición, paz y salvos, contratos, soportes. Y si algo no está claro, lo valida un abogado.',
      },
      {
        id: 'condiciones',
        label: 'Deja por escrito las condiciones y los puntos no negociables',
        why: 'Lo que no se define antes se improvisa en la mesa, y ahí se pierde.',
      },
      {
        id: 'financiacion',
        label: 'Cierra cómo se paga cada parte, incluida la cuota final',
        why: 'Poder pagar la cuota inicial y no la final es la forma más común de quedarse atrapado.',
      },
      {
        id: 'contingencia',
        label: 'Escribe tu plan de contingencia',
        why: '¿Qué haces si se retrasa la entrega, no sale el crédito, sube un costo o se demora la venta?',
      },
      {
        id: 'decision',
        label: 'Cierra el expediente: avanza, investiga más, negocia o rechaza',
        why: 'Es el resultado verificable del método. Cuatro salidas posibles, todas legítimas.',
        evidence: 'filtro-decidida',
      },
    ],
  },
];

export const ALL_TASK_IDS = BLOCKS.flatMap((block) =>
  block.tasks.map((task) => task.id),
);

export function findTask(id: string): Task | undefined {
  for (const block of BLOCKS) {
    const task = block.tasks.find((item) => item.id === id);
    if (task) return task;
  }
  return undefined;
}
