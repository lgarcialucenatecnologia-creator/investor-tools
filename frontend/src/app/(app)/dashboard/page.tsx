import type { Metadata } from 'next';
import { ToolCard, type Tool } from '@/components/app/tool-card';
import { getSession } from '@/lib/session/server';

export const metadata: Metadata = { title: 'Tu panel' };

/**
 * Los destinos son `null` mientras el módulo no exista. Cuando cada uno
 * tenga su ruta, se escribe acá y la tarjeta pasa a ser un enlace sola.
 */
const TOOLS: Tool[] = [
  {
    name: 'Índice de Blindaje Patrimonial',
    description:
      'Tu diagnóstico: qué tan protegido está lo que ya construiste, y dónde está la grieta.',
    href: null,
  },
  {
    name: 'Mi Ruta Patrimonial',
    description:
      'Tu plan patrimonial año a año. Sabes qué sigue, cuándo y por qué — sin improvisar.',
    href: null,
  },
  {
    name: 'Consultor Luifer',
    description:
      'Resuelve tus dudas por WhatsApp, con el mismo criterio con el que Luifer estructura su propio patrimonio.',
    href: null,
    accent: true,
  },
  {
    name: 'Filtro de Seguridad',
    description:
      'Antes de comprar, pasa el proyecto por el filtro. Si no cumple, no entra. Así de simple.',
    href: null,
  },
];

export default async function DashboardPage() {
  const user = await getSession();
  const firstName = user?.email.split('@')[0] ?? '';

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          Tu panel
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil md:text-4xl">
          Todo en un solo lugar, sin ruido
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-marfil/70">
          Lo básico es lo que funciona. Cada herramienta existe para que dejes
          de suponer y empieces a decidir con metodología.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>

      <p className="text-sm text-grafito-texto">
        Sesión iniciada como {firstName}. Las herramientas se irán habilitando
        a medida que estén listas.
      </p>
    </div>
  );
}
