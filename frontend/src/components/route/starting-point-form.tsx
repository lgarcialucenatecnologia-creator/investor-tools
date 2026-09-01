'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/filter/money-input';
import { api } from '@/lib/api/client';
import type { RouteOverview, StartingPoint } from '@/lib/api/types';

/**
 * El Punto de Partida.
 *
 * Las preguntas salen de la Ficha de Punto de Partida del método y del Módulo
 * 1. La reserva se pregunta ANTES del crédito a propósito: el orden del
 * formulario enseña el orden del cálculo — primero se protege lo que no se
 * toca, y con el resto se compra.
 */
export function StartingPointForm({
  initial,
  onSaved,
}: {
  initial: StartingPoint | null;
  onSaved: (overview: RouteOverview) => void;
}) {
  const [city, setCity] = useState(initial?.city ?? '');
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? '');
  const [availableCash, setAvailableCash] = useState<number | null>(
    initial?.availableCash ?? null,
  );
  const [safetyReserve, setSafetyReserve] = useState<number | null>(
    initial?.safetyReserve ?? null,
  );
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(
    initial?.monthlyIncome ?? null,
  );
  const [monthlyObligations, setMonthlyObligations] = useState<number | null>(
    initial?.monthlyObligations ?? null,
  );
  const [possibleCredit, setPossibleCredit] = useState<number | null>(
    initial?.possibleCredit ?? null,
  );
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [mainDifficulty, setMainDifficulty] = useState(
    initial?.mainDifficulty ?? '',
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (availableCash === null || monthlyIncome === null) {
      setError('Necesito al menos el dinero disponible y tu ingreso mensual.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      onSaved(
        await api<RouteOverview>('/route/starting-point', {
          method: 'POST',
          body: JSON.stringify({
            ...(city.trim() ? { city: city.trim() } : {}),
            ...(propertyType.trim() ? { propertyType: propertyType.trim() } : {}),
            availableCash,
            safetyReserve: safetyReserve ?? 0,
            monthlyIncome,
            monthlyObligations: monthlyObligations ?? 0,
            possibleCredit: possibleCredit ?? 0,
            ...(goal.trim() ? { goal: goal.trim() } : {}),
            ...(mainDifficulty.trim()
              ? { mainDifficulty: mainDifficulty.trim() }
              : {}),
          }),
        }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-6 rounded-lg border border-grafito/20 bg-nocturno p-7"
    >
      <div>
        <h2 className="font-display text-xl text-marfil">Punto de Partida</h2>
        <p className="mt-2 max-w-2xl text-sm text-grafito-texto">
          Saber desde dónde arrancas, antes de mirar una sola propiedad. De acá
          sale tu rango de compra.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pp-city">Ciudad donde buscas</Label>
          <Input
            id="pp-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cali"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pp-type">Tipo de propiedad</Label>
          <Input
            id="pp-type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            placeholder="Apartamento usado"
          />
        </div>
      </div>

      <div className="grid gap-5 border-t border-grafito/15 pt-6 md:grid-cols-2">
        <MoneyInput
          label="Dinero disponible"
          value={availableCash}
          onChange={setAvailableCash}
          hint="Lo que tienes hoy para poner."
          placeholder="200.000.000"
        />
        <MoneyInput
          label="Reserva que NO vas a comprometer"
          value={safetyReserve}
          onChange={setSafetyReserve}
          hint="Para imprevistos, retrasos, cuotas y adecuaciones. Esto no se toca."
          placeholder="30.000.000"
        />
        <MoneyInput
          label="Ingreso mensual libre"
          value={monthlyIncome}
          onChange={setMonthlyIncome}
          placeholder="8.000.000"
        />
        <MoneyInput
          label="Obligaciones mensuales"
          value={monthlyObligations}
          onChange={setMonthlyObligations}
          hint="Lo que ya está comprometido cada mes."
          placeholder="3.000.000"
        />
        <MoneyInput
          label="Crédito que podrías conseguir"
          value={possibleCredit}
          onChange={setPossibleCredit}
          hint="Déjalo en cero si todavía no lo has averiguado."
          placeholder="150.000.000"
        />
      </div>

      <div className="grid gap-5 border-t border-grafito/15 pt-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pp-goal">Tu meta</Label>
          <Input
            id="pp-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Mi primera inversión inmobiliaria"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pp-diff">Tu dificultad principal</Label>
          <Input
            id="pp-diff"
            value={mainDifficulty}
            onChange={(e) => setMainDifficulty(e.target.value)}
            placeholder="No sé si un precio tiene sentido"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="animate-spin" size={16} />
          ) : initial ? (
            'Guardar cambios'
          ) : (
            'Calcular mi rango y arrancar'
          )}
        </Button>
      </div>

      {initial && (
        <p className="text-xs text-grafito-texto">
          Corregir estos datos no reinicia tus 90 días ni borra tu avance.
        </p>
      )}
    </form>
  );
}
