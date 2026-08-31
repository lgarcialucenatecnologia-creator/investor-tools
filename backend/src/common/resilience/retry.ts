/**
 * Reintentos y respaldo entre modelos.
 *
 * Vive aquí y no dentro de un módulo porque lo necesitan dos partes muy
 * distintas —la transcripción del PDF y el chat— por la misma razón: los
 * modelos de Gemini se saturan de verdad y con frecuencia. Medido contra la
 * clave de este proyecto, en una misma tarde: gemini-3.7-flash devolvió 503
 * en 3 de 3 intentos y gemini-3.5-flash respondió 3 de 3.
 *
 * Sin esto, cualquier pico de demanda ajeno se convierte en una caída propia.
 */

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export function statusOf(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = error.status;
    if (typeof status === 'number') return status;
  }
  return null;
}

export function isRetryable(error: unknown): boolean {
  const status = statusOf(error);
  // Sin código es casi siempre un problema de red, y eso sí se reintenta.
  return status === null || RETRYABLE.has(status);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  onRetry?: (message: string) => void;
}

/** Espera creciente. La saturación suele ser pasajera; a veces no. */
export async function withRetry<T>(
  label: string,
  attempt: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 4;
  const base = options.baseDelayMs ?? 4_000;
  let lastError: unknown;

  for (let tries = 0; tries < attempts; tries += 1) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
      if (tries === attempts - 1) break;

      const delay = base * 2 ** tries;
      options.onRetry?.(
        `${label}: ${statusOf(error) ?? 'error de red'}, reintento ${tries + 1} de ${attempts - 1} en ${delay / 1000}s`,
      );
      await wait(delay);
    }
  }

  throw lastError;
}

/**
 * Recorre los modelos en orden, agotando los reintentos de cada uno.
 *
 * Un error que NO es de saturación corta de inmediato: cambiar de modelo no
 * arregla una petición mal formada y solo gastaría dinero repitiendo el fallo.
 */
export async function withFallback<T>(
  models: string[],
  label: string,
  attempt: (model: string, isFallback: boolean) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (const [index, model] of models.entries()) {
    try {
      return await withRetry(
        `${label} · ${model}`,
        () => attempt(model, index > 0),
        options,
      );
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
      const next = models[index + 1];
      if (next) {
        options.onRetry?.(`${label}: ${model} saturado, se pasa a ${next}`);
      }
    }
  }

  throw lastError;
}
