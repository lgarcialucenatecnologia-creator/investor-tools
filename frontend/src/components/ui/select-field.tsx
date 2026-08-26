import { useId } from 'react';
import { Label } from './label';

/**
 * Selector nativo. Radix da uno con más control visual, pero en un teléfono
 * el nativo abre la rueda del sistema, que se usa mejor que cualquier lista
 * dibujada a mano.
 */
export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base text-marfil shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-nocturno text-marfil"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
