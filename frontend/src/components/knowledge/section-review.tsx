'use client';

import { useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import type { KnowledgeDetail, KnowledgeSection } from '@/lib/api/types';

/**
 * Revisión del texto extraído, sección por sección.
 *
 * Existe porque la extracción puede equivocarse —una tabla mal leída, un
 * párrafo pegado— y volver a subir el PDF entero para arreglar un renglón
 * sería absurdo. Corregir aquí invalida el caché: lo guardado deja de
 * coincidir con lo que respondía.
 */
export function SectionReview({
  detail,
  onSaved,
}: {
  detail: KnowledgeDetail;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(section: KnowledgeSection) {
    setBusy(true);
    setError(null);
    try {
      await api(`/knowledge/${detail.id}/sections`, {
        method: 'POST',
        body: JSON.stringify({ order: section.order, body: draft }),
      });
      setEditing(null);
      onSaved();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      {detail.sections.map((section) => {
        const open = editing === section.order;
        return (
          <article
            key={section.order}
            className="surface"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-grafito/15 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-grafito-texto">
                  {String(section.order).padStart(2, '0')}
                </span>
                <h3 className="text-marfil">{section.title}</h3>
                {section.edited && (
                  <span className="rounded border border-dorado/40 px-2 py-0.5 text-xs text-dorado">
                    corregida
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-grafito-texto">
                  {section.body.length.toLocaleString('es-CO')} car.
                </span>
                {open ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      aria-label="Descartar cambios"
                      className="grid size-8 place-items-center rounded-md text-grafito-texto hover:text-marfil"
                    >
                      <X size={15} />
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void save(section)}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <Check size={14} />
                          Guardar
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(section.order);
                      setDraft(section.body);
                    }}
                    aria-label={`Corregir «${section.title}»`}
                    className="grid size-8 place-items-center rounded-md text-grafito-texto transition-colors hover:text-dorado"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </header>

            <div className="px-5 py-4">
              {open ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={16}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-marfil outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              ) : (
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-marfil/70">
                  {section.body || '(vacía)'}
                </pre>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
