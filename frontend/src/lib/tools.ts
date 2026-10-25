/**
 * Las herramientas de la plataforma, en un solo sitio.
 *
 * El menú lateral y la vista de cada una salen de aquí, así que agregar una
 * herramienta o marcarla como lista es cambiar una línea. `ready: false`
 * significa que la ruta existe y explica qué va a hacer, pero todavía no
 * calcula nada — es más honesto que esconderla, porque el cliente ya pagó
 * por las cuatro.
 */
import {
  ClipboardCheck,
  MessagesSquare,
  Route,
  Target,
  type LucideIcon,
} from 'lucide-react';

export interface Tool {
  slug: string;
  icon: LucideIcon;
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
    slug: 'ruta',
    icon: Route,
    name: 'Mi Ruta de 90 Días',
    tagline: 'Qué hacer y en qué orden',
    description:
      'El plan del método, en tres bloques de treinta días. Sabes qué sigue, cuándo y por qué — sin improvisar.',
    promises: [
      'Tu rango de compra: hasta cuánto puedes ir sin desorganizarte',
      'Qué toca hacer en cada bloque, y por qué importa',
      'El avance se demuestra con trabajo hecho, no con casillas',
    ],
    ready: true,
  },
  {
    slug: 'pension',
    icon: Target,
    name: 'Mi Meta de Pensión',
    tagline: 'Cuánto necesitas para vivir de rentas',
    description:
      'El capital que, solo con sus rentas, paga tu vida sin tocarlo. Cuánto tienes, cuánto te falta y cuándo llegas a tu ritmo.',
    promises: [
      'Tu meta: el capital que paga tus gastos sin gastarse',
      'Cuánto te falta y en cuántos años llegas',
      'Qué cambia si vendes un activo o reduces gastos',
    ],
    ready: true,
  },
  {
    slug: 'consultor',
    icon: MessagesSquare,
    name: 'Consultor Luifer',
    tagline: 'Acompañamiento directo',
    description:
      'Resuelve tus dudas por WhatsApp, con el mismo criterio con el que Luifer estructura su propio patrimonio.',
    promises: [
      'Preguntas respondidas por WhatsApp, sin agendar nada',
      'Respuestas que conocen tu Ruta y tus proyectos, no genéricas',
      'Lo que hablaron queda guardado acá',
    ],
    ready: false,
    accent: true,
  },
  {
    slug: 'checklist',
    icon: ClipboardCheck,
    name: 'Check List',
    tagline: 'Punto por punto',
    description:
      'Revisa el proyecto criterio por criterio, a medida que averiguas cada punto. Tus observaciones quedan guardadas con el proyecto.',
    promises: [
      'Doce criterios con su guía: qué mirar y qué preguntar',
      'Cada punto calificado de 1 a 5, con tus observaciones',
      'Varios proyectos guardados para compararlos con calma',
    ],
    ready: true,
  },
];

export function findTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
