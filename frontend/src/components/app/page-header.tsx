import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Columna legible para formularios y herramientas largas. */
export function PageContainer({
  children,
  wide = false,
  fill = false,
}: {
  children: ReactNode;
  /** El chat y las tablas aprovechan más ancho que un formulario. */
  wide?: boolean;
  /** Ocupa todo el alto: el chat fija su caja de texto abajo. */
  fill?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full ${wide ? 'max-w-5xl' : 'max-w-4xl'} ${fill ? 'h-full min-h-0' : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * Encabezado común de las herramientas: ícono, antetítulo, título y una
 * línea de contexto. Que todas empiecen igual es lo que hace que la
 * plataforma se sienta un solo producto y no cuatro páginas sueltas.
 */
export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  accent = 'dorado',
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  accent?: 'dorado' | 'azul';
}) {
  return (
    <header className="animate-rise flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${
              accent === 'azul'
                ? 'border-azul/60 bg-azul/25 text-marfil'
                : 'border-dorado/35 bg-dorado/10 text-dorado'
            }`}
          >
            <Icon size={20} strokeWidth={1.8} />
          </span>
          <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
            {eyebrow}
          </p>
        </div>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight text-marfil md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-marfil/70">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
