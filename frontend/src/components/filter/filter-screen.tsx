'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import type { Analysis, FilterDefaults, FilterResult } from '@/lib/api/types';
import { money, percent, shortDate } from '@/lib/format';
import {
  ComparablesField,
  emptyComparable,
  toComparables,
  type ComparableDraft,
} from './comparables-field';
import { MoneyInput } from './money-input';
import { Verdict } from './verdict';

/**
 * El historial llega ya resuelto desde el servidor, igual que los valores por
 * defecto. Pedirlo desde el navegador al montar cuesta una vuelta y un
 * parpadeo, y no hay razón: la página ya se renderiza en el servidor.
 */
export function FilterScreen({
  defaults,
  initialHistory,
}: {
  defaults: FilterDefaults;
  initialHistory: Analysis[];
}) {
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [listedPrice, setListedPrice] = useState<number | null>(null);
  const [areaM2, setAreaM2] = useState('');
  const [drafts, setDrafts] = useState<ComparableDraft[]>([
    emptyComparable(),
    emptyComparable(),
  ]);

  const [showRates, setShowRates] = useState(false);
  const [deedCostRate, setDeedCostRate] = useState(defaults.deedCostRate);
  const [taxRate, setTaxRate] = useState(defaults.taxRate);
  const [safetyMarginRate, setSafetyMarginRate] = useState(
    defaults.safetyMarginRate,
  );
  const [refurbishCost, setRefurbishCost] = useState<number | null>(null);

  const [result, setResult] = useState<FilterResult | null>(null);
  const [history, setHistory] = useState<Analysis[]>(initialHistory);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const comparables = useMemo(() => toComparables(drafts), [drafts]);
  const area = Number(areaM2.replace(/\D/g, ''));
  const complete =
    Boolean(listedPrice) && area > 0 && comparables.length >= 2;

  const payload = useMemo(
    () => ({
      projectName: projectName.trim() || 'Sin nombre',
      ...(location.trim() ? { location: location.trim() } : {}),
      listedPrice: listedPrice ?? 0,
      areaM2: area,
      comparables,
      deedCostRate,
      taxRate,
      safetyMarginRate,
      refurbishCost: refurbishCost ?? 0,
    }),
    [
      projectName,
      location,
      listedPrice,
      area,
      comparables,
      deedCostRate,
      taxRate,
      safetyMarginRate,
      refurbishCost,
    ],
  );

  // El resultado se recalcula mientras se escribe, pero con una espera: sin
  // ella cada tecla sería una petición al servidor.
  useEffect(() => {
    // Si faltan datos no se borra el resultado anterior desde aquí: se
    // ignora al pintar. Borrarlo en el efecto provoca un render en cascada.
    if (!complete) return;
    const id = window.setTimeout(() => {
      api<FilterResult>('/filter/preview', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
        .then((r) => {
          setResult(r);
          setError(null);
        })
        .catch((caught: Error) => setError(caught.message));
    }, 400);
    return () => window.clearTimeout(id);
  }, [complete, payload]);

  async function handleSave() {
    if (!projectName.trim()) {
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
          Pasa el proyecto por el filtro. Si no cumple, no entra. Así de
          simple.
        </p>
      </header>

      <section className="flex flex-col gap-6 rounded-lg border border-grafito/20 bg-nocturno p-7">
        <div className="grid gap-5 md:grid-cols-2">
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
              onChange={(e) => setAreaM2(e.target.value.replace(/\D/g, ''))}
              placeholder="80"
              className="tabular-nums"
            />
          </div>
        </div>

        <div className="border-t border-grafito/20 pt-6">
          <ComparablesField drafts={drafts} onChange={setDrafts} />
        </div>

        <div className="border-t border-grafito/20 pt-6">
          <button
            type="button"
            onClick={() => setShowRates((v) => !v)}
            aria-expanded={showRates}
            className="flex items-center gap-2 text-sm text-dorado underline-offset-4 hover:underline"
          >
            <SlidersHorizontal size={15} />
            {showRates ? 'Ocultar' : 'Ajustar'} costos y margen
          </button>

          {/* Escondidos por defecto: son los valores del método y casi nunca
              hay que tocarlos. Quien los necesite, los encuentra. */}
          {showRates && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <RateInput
                label="Escrituración y registro"
                value={deedCostRate}
                onChange={setDeedCostRate}
              />
              <RateInput label="Impuestos" value={taxRate} onChange={setTaxRate} />
              <RateInput
                label="Margen de seguridad"
                value={safetyMarginRate}
                onChange={setSafetyMarginRate}
                hint="Lo que quieres ganar el día que firmas."
              />
              <MoneyInput
                label="Adecuaciones"
                value={refurbishCost}
                onChange={setRefurbishCost}
                hint="Lo que hay que invertir para dejarlo listo."
              />
            </div>
          )}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      {complete && result ? (
        <section className="flex flex-col gap-5">
          <Verdict result={result} listedPrice={listedPrice ?? 0} />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <Save size={15} />
                  Guardar este análisis
                </>
              )}
            </Button>
            {saved && (
              <span role="status" className="text-sm text-dorado">
                «{saved}» quedó guardado abajo.
              </span>
            )}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-grafito/30 px-6 py-10 text-center text-grafito-texto">
          Completa el precio, el área y al menos dos comparables. El veredicto
          aparece solo.
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
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-sm tabular-nums text-marfil/70">
                    máx. {money(item.result.maxPrice)}
                  </span>
                  <span
                    className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs ${
                      item.result.passes
                        ? 'border-dorado/40 bg-dorado/10 text-dorado'
                        : 'border-alerta/40 bg-alerta/10 text-alerta'
                    }`}
                  >
                    {item.result.passes ? 'Pasa' : 'No pasa'}
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

function RateInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          inputMode="decimal"
          // Se escribe en porcentaje y se guarda en proporción: nadie piensa
          // «0,02», todo el mundo piensa «2%».
          value={String(Math.round(value * 1000) / 10).replace('.', ',')}
          onChange={(e) => {
            const parsed = Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
            if (Number.isFinite(parsed)) onChange(Math.min(50, parsed) / 100);
          }}
          className="pr-8 tabular-nums"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grafito-texto">
          %
        </span>
      </div>
      <p className="text-xs text-grafito-texto">
        {hint ?? `Sobre el valor de mercado. Ahora: ${percent(value)}`}
      </p>
    </div>
  );
}
