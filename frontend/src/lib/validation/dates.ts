/** Fechas para <input type="date">, que habla en AAAA-MM-DD. */

export function toDateInput(date: Date): string {
  // Se usan las partes locales y no toISOString: en Colombia (UTC-5) el ISO
  // de una fecha de hoy a las 20:00 devuelve la de mañana.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Vencimiento por defecto: un año desde hoy. */
export function defaultExpiry(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return toDateInput(date);
}

/**
 * Convierte lo escrito en el campo a un instante. Se fija al final del día
 * para que «vence el 30 de octubre» signifique que ese día todavía entra.
 */
export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 23, 59, 59).toISOString();
}
