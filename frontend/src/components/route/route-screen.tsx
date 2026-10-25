'use client';

import { useState } from 'react';
import { Pencil, Route } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import type { RouteOverview } from '@/lib/api/types';
import { BlockCard } from './block-card';
import { BuyingRange } from './buying-range';
import { StartingPointForm } from './starting-point-form';

export function RouteScreen({ initial }: { initial: RouteOverview }) {
  const [overview, setOverview] = useState(initial);
  const [editing, setEditing] = useState(false);

  const current = overview.blocks.find((block) => block.current);
  const doneTotal = overview.blocks.reduce((sum, b) => sum + b.done, 0);
  const allTotal = overview.blocks.reduce((sum, b) => sum + b.total, 0);

  function received(next: RouteOverview) {
    setOverview(next);
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <PageHeader
          icon={Route}
          eyebrow="Qué hacer y en qué orden"
          title="Mi Ruta de 90 Días"
          description="El plan del método en tres bloques de treinta días. Cada tarea dice qué hacer y por qué importa."
        />

        {/* La regla crítica del método, arriba y visible. No en letra chica:
            es la promesa que más fácil se malinterpreta. */}
        <p className="max-w-2xl rounded-2xl border border-azul/40 bg-azul/10 px-5 py-4 text-sm leading-relaxed text-marfil/85">
          <span className="text-marfil">
            90 días no significa una compra garantizada en 90 días.
          </span>{' '}
          La meta es que al final puedas aprobar, rechazar o seguir investigando
          una oportunidad con criterio propio. Rechazar también cuenta.
        </p>
      </div>

      {!overview.started || editing ? (
        <StartingPointForm
          initial={overview.startingPoint}
          onSaved={received}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-baseline gap-5">
              <p className="text-marfil">
                <span className="font-display text-2xl text-dorado">
                  Día {overview.day}
                </span>
                <span className="ml-2 text-sm text-grafito-texto">de 90</span>
              </p>
              <p className="text-sm text-grafito-texto">
                {doneTotal} de {allTotal} tareas hechas
                {current && ` · vas en ${current.stages}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 text-sm text-grafito-texto underline-offset-4 transition-colors hover:text-dorado hover:underline"
            >
              <Pencil size={14} />
              Corregir mi Punto de Partida
            </button>
          </div>

          {overview.range && <BuyingRange range={overview.range} />}

          <section className="flex flex-col gap-4">
            {/* El bloque en curso primero y los demás detrás. Ver cuarenta
                tareas de golpe paraliza; el método pide un siguiente paso, en
                singular. */}
            {[...overview.blocks]
              .sort((a, b) =>
                a.current === b.current ? a.order - b.order : a.current ? -1 : 1,
              )
              .map((block) => (
                <BlockCard key={block.id} block={block} onChanged={setOverview} />
              ))}
          </section>
        </>
      )}
    </div>
  );
}
