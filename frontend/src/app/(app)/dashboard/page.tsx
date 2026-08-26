import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/session/server';
import { TOOLS } from '@/lib/tools';

export const metadata: Metadata = { title: 'Inicio' };

export default async function DashboardHome() {
  const user = await getSession();
  const name = user?.email.split('@')[0] ?? '';
  const ready = TOOLS.filter((tool) => tool.ready).length;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          Tu panel
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil md:text-4xl">
          Hola, {name}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-marfil/70">
          Lo básico es lo que funciona. Cada herramienta existe para que dejes
          de suponer y empieces a decidir con metodología.
        </p>
      </header>

      {/* El primer paso es el Índice: sin diagnóstico, el resto no tiene de
          dónde partir. Por eso encabeza y no comparte fila con las demás. */}
      <section className="rounded-lg border border-dorado/40 bg-nocturno p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-dorado">
          Empieza por aquí
        </p>
        <h2 className="mt-4 font-display text-2xl text-marfil">
          {TOOLS[0].name}
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-marfil/70">
          {TOOLS[0].description}
        </p>
        <Link
          href={`/dashboard/${TOOLS[0].slug}`}
          className="mt-6 inline-flex items-center gap-2 text-dorado underline-offset-4 hover:underline"
        >
          Ver de qué se trata
          <ArrowRight size={16} />
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Lo demás
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {TOOLS.slice(1).map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/dashboard/${tool.slug}`}
                className="group block h-full rounded-lg border border-grafito/20 bg-nocturno p-6 transition-colors hover:border-dorado/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg text-marfil">
                    {tool.name}
                  </h3>
                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-grafito-texto transition-colors group-hover:text-dorado"
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-marfil/70">
                  {tool.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-grafito-texto">
        {ready === 0
          ? 'Las herramientas se irán habilitando a medida que estén listas. Entra a cualquiera para ver qué va a hacer.'
          : `${ready} de ${TOOLS.length} herramientas habilitadas.`}
      </p>
    </div>
  );
}
