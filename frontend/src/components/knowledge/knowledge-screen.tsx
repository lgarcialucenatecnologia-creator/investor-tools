'use client';

import { useCallback, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { shortDate } from '@/lib/format';
import type { KnowledgeDetail, KnowledgeSummary } from '@/lib/api/types';
import { SectionReview } from './section-review';
import { UploadPanel } from './upload-panel';

const STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'border-grafito/40 text-grafito-texto' },
  active: { label: 'Activa', className: 'border-dorado/50 bg-dorado/10 text-dorado' },
  archived: { label: 'Archivada', className: 'border-grafito/30 text-grafito-texto' },
};

export function KnowledgeScreen({
  initialVersions,
}: {
  initialVersions: KnowledgeSummary[];
}) {
  const [versions, setVersions] = useState(initialVersions);
  const [detail, setDetail] = useState<KnowledgeDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (keepOpen?: string) => {
    try {
      setVersions(await api<KnowledgeSummary[]>('/knowledge'));
      if (keepOpen) {
        setDetail(await api<KnowledgeDetail>(`/knowledge/${keepOpen}`));
      }
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  async function open(id: string) {
    setError(null);
    try {
      setDetail(await api<KnowledgeDetail>(`/knowledge/${id}`));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function activate(id: string) {
    if (
      !window.confirm(
        'Esta versión pasará a responder a todos los clientes y la anterior quedará archivada. ¿Seguir?',
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/knowledge/${id}/activate`, { method: 'POST' });
      await refresh(id);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          Consultor Luifer
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil">
          Base de conocimiento
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-grafito-texto">
          Lo que el Consultor sabe del método. Se versiona: una respuesta vieja
          tiene que poder rastrearse al material con el que se dio.
        </p>
      </header>

      <UploadPanel onUploaded={() => void refresh()} />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          Versiones
        </h2>

        {versions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-grafito/30 px-6 py-10 text-center text-grafito-texto">
            Todavía no has cargado el documento del método.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {versions.map((item) => {
              const chip = STATUS[item.status] ?? STATUS.draft;
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 surface px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-marfil">
                      Versión {item.version}
                      <span className="ml-3 text-sm text-grafito-texto">
                        {item.sourceFileName}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-grafito-texto">
                      {item.pageCount} páginas ·{' '}
                      {item.charCount.toLocaleString('es-CO')} caracteres ·{' '}
                      {shortDate.format(new Date(item.createdAt))}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs ${chip.className}`}
                    >
                      {chip.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => void open(item.id)}
                      className="rounded-md border border-grafito/40 px-3 py-1.5 text-xs text-marfil/80 transition-colors hover:border-dorado hover:text-dorado"
                    >
                      Revisar
                    </button>
                    {item.status !== 'active' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void activate(item.id)}
                      >
                        {busy ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            Activar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {detail && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
              Versión {detail.version} · {detail.sections.length} secciones
            </h2>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="text-sm text-grafito-texto underline-offset-4 hover:text-marfil hover:underline"
            >
              Cerrar la revisión
            </button>
          </div>
          <SectionReview detail={detail} onSaved={() => void refresh(detail.id)} />
        </section>
      )}
    </div>
  );
}
