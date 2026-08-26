'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Campo de contraseña con el ojo para revelarla.
 *
 * El botón lleva `aria-label` y queda fuera del orden de tabulación por
 * defecto no: sí es alcanzable con teclado, porque para quien no usa ratón
 * revisar lo que escribió es igual de necesario.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-grafito-texto transition-colors hover:text-marfil focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dorado"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-alerta">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-grafito-texto">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
