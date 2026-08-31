'use client';

import Link from 'next/link';
import { FileDown, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import type { Analysis } from '@/lib/api/types';
import { money, shortDate } from '@/lib/format';

const VERDICT_CHIP: Record<string, string> = {
  verde: 'border-dorado/40 bg-dorado/10 text-dorado',
  amarillo: 'border-oro/40 bg-oro/10 text-oro',
  rojo: 'border-alerta/40 bg-alerta/10 text-alerta',
  indeterminado: 'border-grafito/40 text-grafito-texto',
};

export function HistoryDialog({
  open,
  onOpenChange,
  history,
  onDelete,
  deletingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: Analysis[];
  onDelete: (analysis: Analysis) => void;
  deletingId: string | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Proyectos que ya pasaste"
      description={
        history.length === 0
          ? undefined
          : `${history.length} evaluación${history.length === 1 ? '' : 'es'} guardada${history.length === 1 ? '' : 's'}.`
      }
    >
      {history.length === 0 ? (
        <p className="py-6 text-center text-sm text-grafito-texto">
          Todavía no has guardado ninguna. Completa una evaluación y pulsa
          «Guardar».
        </p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {history.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-grafito/20 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-marfil">
                  {item.projectName}
                </p>
                <p className="text-xs text-grafito-texto">
                  {item.location ? `${item.location} · ` : ''}
                  {shortDate.format(new Date(item.createdAt))}
                  {item.pricing ? ` · máx. ${money(item.pricing.maxPrice)}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-grafito-texto">
                  {item.result.score ?? '—'} · {item.result.confidence}%
                </span>
                <span
                  className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs ${
                    VERDICT_CHIP[item.result.verdict] ?? VERDICT_CHIP.indeterminado
                  }`}
                >
                  {item.result.label}
                </span>

                {/* Se abre en otra pestaña: la evaluación en curso no se
                    pierde por ir a mirar una vieja. */}
                <Link
                  href={`/imprimir/filtro/${item.id}`}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Descargar el PDF de ${item.projectName}`}
                  title="Descargar PDF"
                  className="grid size-8 place-items-center rounded-md text-grafito-texto transition-colors hover:text-dorado"
                >
                  <FileDown size={16} />
                </Link>

                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  disabled={deletingId === item.id}
                  aria-label={`Borrar la evaluación de ${item.projectName}`}
                  title="Borrar"
                  className="grid size-8 place-items-center rounded-md text-grafito-texto transition-colors hover:text-alerta disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
