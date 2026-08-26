/**
 * Las herramientas de la plataforma, en un solo sitio.
 *
 * El menú lateral y la vista de cada una salen de aquí, así que agregar una
 * herramienta o marcarla como lista es cambiar una línea. `ready: false`
 * significa que la ruta existe y explica qué va a hacer, pero todavía no
 * calcula nada — es más honesto que esconderla, porque el cliente ya pagó
 * por las cuatro.
 */
export interface Tool {
  slug: string;
  name: string;
  /** Frase corta para el menú. */
  tagline: string;
  description: string;
  /** Qué va a poder hacer aquí cuando esté lista. */
  promises: string[];
  ready: boolean;
  /** Solo el Consultor lleva el azul de marca. */
  accent?: boolean;
}

export const TOOLS: Tool[] = [
  {
    slug: 'indice',
    name: 'Índice de Blindaje Patrimonial',
    tagline: 'Tu diagnóstico',
    description:
      'Qué tan protegido está lo que ya construiste, y dónde está la grieta.',
    promises: [
      'Un número que resume qué tan blindado está tu patrimonio hoy',
      'Las tres grietas más grandes, ordenadas por lo que te costaría cada una',
      'Qué mover primero, sin tener que entender de finanzas',
    ],
    ready: false,
  },
  {
    slug: 'ruta',
    name: 'Mi Ruta Patrimonial',
    tagline: 'Tu plan año a año',
    description:
      'Sabes qué sigue, cuándo y por qué — sin improvisar.',
    promises: [
      'Tu plan escrito, año por año, con lo que toca hacer en cada uno',
      'Qué pasa si adelantas o aplazas una compra',
      'El avance real contra lo que planeaste',
    ],
    ready: false,
  },
  {
    slug: 'consultor',
    name: 'Consultor Luifer',
    tagline: 'Acompañamiento directo',
    description:
      'Resuelve tus dudas por WhatsApp, con el mismo criterio con el que Luifer estructura su propio patrimonio.',
    promises: [
      'Preguntas respondidas por WhatsApp, sin agendar nada',
      'Respuestas que conocen tu Índice y tu Ruta, no genéricas',
      'Lo que hablaron queda guardado acá',
    ],
    ready: false,
    accent: true,
  },
  {
    slug: 'filtro',
    name: 'Filtro de Seguridad',
    tagline: 'Antes de comprar',
    description:
      'Pasa el proyecto por el filtro. Si no cumple, no entra. Así de simple.',
    promises: [
      'El proyecto contra los comparables reales de la zona',
      'Tu precio máximo, con escrituración e impuestos incluidos',
      'Un sí o un no, con las razones escritas',
    ],
    ready: true,
  },
];

export function findTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
