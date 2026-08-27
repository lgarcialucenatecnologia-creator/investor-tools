'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import type { Analysis, Assessment, FilterForm } from '@/lib/api/types';
import { money, shortDate } from '@/lib/format';
import {
  ComparablesField,
  emptyComparable,
  toComparables,
  type ComparableDraft,
} from './comparables-field';
import { CriterionField } from './criterion-field';
import { MoneyInput } from './money-input';
import { ResultPanel } from './result-panel';

export function FilterScreen({
  form,
  initialHistory,
}: {
  form: FilterForm;
  initialHistory: Analysis[];
}) {
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [listedPrice, setListedPrice] = useState<number | null>(null);
  const [areaM2, setAreaM2] = useState('');
  const [drafts, setDrafts] = useState<ComparableDraft[]>([
    emptyComparable(),
    emptyComparable(),
  ]);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<Analysis[]>(initialHistory);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const asked = useMemo(
    () => form.criteria.filter((c) => !c.derived),
    [form.criteria],
  );

  const payload = useMemo(() => {
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      if (value !== undefined) clean[key] = value;
    }
    const comparables = toComparables(drafts);
    const area = Number(areaM2.replace(/\D/g, ''));
    return {
      projectName: projectName.trim() || 'Sin nombre',
      ...(location.trim() ? { location: location.trim() } : {}),
      answers: clean,
      ...(listedPrice ? { listedPrice } : {}),
      ...(area > 0 ? { areaM2: area } : {}),
      ...(comparables.length >= 2 ? { comparables } : {}),
    };
  }, [projectName, location, answers, listedPrice, areaM2, drafts]);

  const answeredCount = Object.values(answers).filter(
    (v) => v !== undefined,
  ).length;

  // Se reevalúa al responder, con espera: sin ella cada clic sería una
  // petición, y aquí se responde rápido y seguido.
  useEffect(() => {
    if (answeredCount === 0) return;
    const id = window.setTimeout(() => {
      api<Assessment>('/filter/assess', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
        .then((result) => {
          setAssessment(result);
          setError(null);
        })
        .catch((caught: Error) => setError(caught.message));
    }, 350);
    return () => window.clearTimeout(id);
  }, [answeredCount, payload]);

  async function handleSave() {
    if (projectName.trim().length < 2) {
      setError('Ponle un nombre al proyecto para poder guardarlo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const analysis = await api<Analysis>('/filter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSaved(analysis.projectName);
      setHistory(await api<Analysis[]>('/filter'));
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          Antes de comprar
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil md:text-4xl">
          Filtro de Seguridad
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-marfil/70">
          Pon el proyecto que te ofrecieron y responde lo que sepas. Lo que no
          sepas también cuenta: te dice qué preguntar antes de firmar.
        </p>
      </header>

      <section className="grid gap-5 rounded-lg border border-grafito/20 bg-nocturno p-7 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="project">Proyecto</Label>
          <Input
            id="project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Torre Aralia 402"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="location">Dónde queda (opcional)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Cll 12, Cali"
          />
        </div>
      </section>

      {form.categories.map((category) => {
        const items = asked.filter((c) => c.category === category.id);
        return (
          <section
            key={category.id}
            className="rounded-lg border border-grafito/20 bg-nocturno p-7"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl text-marfil">
                {category.name}
              </h2>
              <span className="text-xs uppercase tracking-[0.14em] text-grafito-texto">
                pesa {category.weight}% del resultado
              </span>
            </div>
            <p className="mt-2 text-sm text-grafito-texto">
              {category.description}
            </p>

            <div className="mt-6 flex flex-col gap-5">
              {items.map((criterion) => (
                <CriterionField
                  key={criterion.id}
                  criterion={criterion}
                  value={answers[criterion.id]}
                  onChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [criterion.id]: value }))
                  }
                />
              ))}

              {/* El precio no se pregunta: sale de los comparables. Va dentro
                  de su categoría para que se entienda que puntúa igual. */}
              {category.id === 'financial' && (
                <div className="border-t border-grafito/15 pt-5">
                  <p className="text-marfil">Precio contra la zona</p>
                  <p className="mt-1 text-sm text-grafito-texto">
                    No se pregunta: se calcula con los comparables.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <MoneyInput
                      label="Precio publicado"
                      value={listedPrice}
                      onChange={setListedPrice}
                      placeholder="420.000.000"
                    />
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="area">Área en m²</Label>
                      <Input
                        id="area"
                        inputMode="numeric"
                        value={areaM2}
                        onChange={(e) =>
                          setAreaM2(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="80"
                        className="tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="mt-5">
                    <ComparablesField drafts={drafts} onChange={setDrafts} />
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      {assessment ? (
        <>
          <ResultPanel assessment={assessment} criteria={form.criteria} />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <Save size={15} />
                  Guardar esta evaluación
                </>
              )}
            </Button>
            {saved && (
              <span role="status" className="text-sm text-dorado">
                «{saved}» quedó guardada abajo.
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-grafito/30 px-6 py-10 text-center text-grafito-texto">
          Responde lo que sepas. El veredicto aparece solo, y se va afinando con
          cada respuesta.
        </p>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
            Lo que ya pasaste por el filtro
          </h2>
          <ul className="flex flex-col gap-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-grafito/20 bg-nocturno px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-marfil">{item.projectName}</p>
                  <p className="text-xs text-grafito-texto">
                    {item.location ? `${item.location} · ` : ''}
                    {shortDate.format(new Date(item.createdAt))}
                    {item.pricing
                      ? ` · máx. ${money(item.pricing.maxPrice)}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm tabular-nums text-marfil/70">
                    {item.result.score ?? '—'} · {item.result.confidence}%
                  </span>
                  <span
                    className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs ${
                      item.result.verdict === 'verde'
                        ? 'border-dorado/40 bg-dorado/10 text-dorado'
                        : item.result.verdict === 'amarillo'
                          ? 'border-oro/40 bg-oro/10 text-oro'
                          : item.result.verdict === 'rojo'
                            ? 'border-alerta/40 bg-alerta/10 text-alerta'
                            : 'border-grafito/40 text-grafito-texto'
                    }`}
                  >
                    {item.result.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
