import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { TOOLS, findTool } from '@/lib/tools';

/**
 * Una ruta por herramienta del registro.
 *
 * Un slug inventado cae en `notFound()` y el visitante ve la página de «no
 * existe», aunque el código HTTP sea 200: la ruta va detrás del layout de
 * sesión, que ya empezó a enviar la respuesta cuando este archivo corre. En
 * una ruta privada eso no tiene consecuencia — lo que importa es que no se
 * muestre contenido de una herramienta que no existe, y no se muestra.
 */
export function generateStaticParams() {
  return TOOLS.filter((tool) => !tool.ready).map((tool) => ({
    tool: tool.slug,
  }));
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const tool = findTool((await params).tool);
  return { title: tool?.name ?? 'Herramienta' };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const tool = findTool((await params).tool);
  // Una herramienta lista tiene su propia ruta y no pasa por aquí; si llega,
  // es que alguien escribió mal la dirección.
  if (!tool || tool.ready) notFound();

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          {tool.tagline}
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil md:text-4xl">
          {tool.name}
        </h1>
        {tool.accent && (
          <span className="mt-4 inline-block rounded bg-azul px-2.5 py-1 text-xs text-marfil">
            Acompañamiento directo
          </span>
        )}
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-marfil/80">
          {tool.description}
        </p>
      </header>

      {/* Mientras no calcule nada, la vista dice con precisión qué va a
          hacer. Una pantalla vacía con «próximamente» no le sirve a nadie;
          esto sí, porque el cliente sabe qué está esperando. */}
      <section className="rounded-lg border border-grafito/20 bg-nocturno p-7">
        <h2 className="font-display text-xl text-marfil">
          {tool.ready ? 'Qué encuentras aquí' : 'Qué vas a encontrar aquí'}
        </h2>
        <ul className="mt-5 flex flex-col gap-3">
          {tool.promises.map((promise) => (
            <li key={promise} className="flex gap-3 leading-relaxed">
              <Check size={18} className="mt-1 shrink-0 text-dorado" />
              <span className="text-marfil/80">{promise}</span>
            </li>
          ))}
        </ul>
      </section>

      {!tool.ready && (
        <p className="rounded-md border border-grafito/20 px-5 py-4 text-sm text-grafito-texto">
          Todavía no está habilitada. Cuando lo esté, aparece acá mismo — no
          hay nada que instalar ni ninguna cuenta que enlazar.
        </p>
      )}
    </div>
  );
}
