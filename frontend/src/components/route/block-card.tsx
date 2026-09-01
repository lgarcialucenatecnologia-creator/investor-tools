'use client';

import { Check, Loader2, Lock } from 'lucide-react';
import type { RouteBlock, RouteOverview } from '@/lib/api/types';
import { api } from '@/lib/api/client';
import { useState } from 'react';

export function BlockCard({
  block,
  onChanged,
}: {
  block: RouteBlock;
  onChanged: (overview: RouteOverview) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(taskId: string) {
    setBusy(taskId);
    setError(null);
    try {
      onChanged(
        await api<RouteOverview>(`/route/tasks/${taskId}`, { method: 'POST' }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <article
      className={`rounded-lg border p-7 ${
        block.current
          ? 'border-dorado/40 bg-nocturno'
          : 'border-grafito/20 bg-nocturno/50'
      }`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-grafito-texto">
            Días {block.fromDay}–{block.toDay}
            {block.current && (
              <span className="ml-3 text-dorado">· aquí estás</span>
            )}
          </p>
          <h3 className="mt-2 font-display text-xl text-marfil">
            {block.stages}
          </h3>
        </div>
        <span className="text-sm tabular-nums text-grafito-texto">
          {block.done} de {block.total}
        </span>
      </header>

      <p className="mt-3 leading-relaxed text-marfil/80">{block.goal}</p>
      <p className="mt-2 text-sm text-grafito-texto">{block.caveat}</p>

      <ul className="mt-6 flex flex-col gap-1">
        {block.tasks.map((task) => {
          const locked = Boolean(task.provenBy);
          return (
            <li
              key={task.id}
              className="flex gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-obsidiana/40"
            >
              {/* Una tarea que se demuestra sola NO es un botón: fingir que se
                  puede marcar y luego rechazarlo sería una trampa. */}
              {locked ? (
                <span
                  title="Se marca sola cuando el trabajo esté hecho"
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border ${
                    task.done
                      ? 'border-dorado bg-dorado text-obsidiana'
                      : 'border-grafito/40 text-grafito-texto'
                  }`}
                >
                  {task.done ? <Check size={13} /> : <Lock size={11} />}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void toggle(task.id)}
                  disabled={busy === task.id}
                  aria-pressed={task.done}
                  aria-label={task.label}
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors ${
                    task.done
                      ? 'border-dorado bg-dorado text-obsidiana'
                      : 'border-grafito/50 hover:border-dorado'
                  }`}
                >
                  {busy === task.id ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : task.done ? (
                    <Check size={13} />
                  ) : null}
                </button>
              )}

              <div className="min-w-0">
                <p className={task.done ? 'text-marfil/50 line-through' : 'text-marfil'}>
                  {task.label}
                </p>
                <p className="mt-1 text-sm text-grafito-texto">{task.why}</p>
                {locked && (
                  <p className="mt-1 text-xs text-azul">
                    {task.done
                      ? 'Hecha — quedó demostrada con tu trabajo en la plataforma.'
                      : 'Esta se marca sola cuando el trabajo esté hecho.'}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}
    </article>
  );
}
