import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface Tool {
  name: string;
  description: string;
  href: string | null;
  /** El Consultor lleva el azul de marca; el resto, nada. */
  accent?: boolean;
}

/**
 * Una herramienta del panel. Sin destino todavía se muestra igual pero sin
 * enlace: es más honesto que esconderla, porque el cliente ya pagó por las
 * tres y necesita ver qué va a recibir.
 */
export function ToolCard({ tool }: { tool: Tool }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-xl text-marfil">{tool.name}</h2>
        {tool.href && (
          <ArrowRight
            size={18}
            className="mt-1 shrink-0 text-grafito-texto transition-colors group-hover:text-dorado"
          />
        )}
      </div>

      {tool.accent && (
        <span className="mt-3 inline-block rounded bg-azul px-2.5 py-1 text-xs text-marfil">
          Acompañamiento directo
        </span>
      )}

      <p className="mt-4 leading-relaxed text-marfil/70">{tool.description}</p>

      {!tool.href && (
        <p className="mt-5 text-xs uppercase tracking-[0.14em] text-grafito-texto">
          Disponible pronto
        </p>
      )}
    </>
  );

  const shell =
    'rounded-lg border border-grafito/20 bg-nocturno p-7 transition-colors';

  return tool.href ? (
    <Link href={tool.href} className={`group block ${shell} hover:border-dorado/50`}>
      {body}
    </Link>
  ) : (
    <article className={shell}>{body}</article>
  );
}
