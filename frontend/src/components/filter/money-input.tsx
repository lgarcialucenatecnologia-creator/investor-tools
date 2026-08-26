'use client';

import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { number as formatNumber } from '@/lib/format';

/**
 * Campo de pesos con separadores de miles mientras se escribe.
 *
 * Sin esto, quien teclea 420000000 no puede verificar de un vistazo que no
 * le sobró ni le faltó un cero — y en este formulario un cero de más cambia
 * el veredicto por completo.
 */
export function MoneyInput({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string;
  placeholder?: string;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grafito-texto">
          $
        </span>
        <Input
          id={id}
          // `inputMode` y no `type="number"`: el numérico rechaza los puntos
          // de miles y deja el campo en blanco mientras se escribe.
          inputMode="numeric"
          value={value === null ? '' : formatNumber(value)}
          placeholder={placeholder}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onChange(digits ? Number(digits) : null);
          }}
          className="pl-7 tabular-nums"
        />
      </div>
      {hint && <p className="text-xs text-grafito-texto">{hint}</p>}
    </div>
  );
}
