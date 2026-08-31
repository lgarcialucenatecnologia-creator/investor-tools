/**
 * Datos que Consultor Luifer NO puede decir nunca.
 *
 * Viven en código y no en la base a propósito: son una regla de seguridad, no
 * un dato. Quiero su historial en git — quién la cambió, cuándo y por qué.
 *
 * La lista sale de la sección 26 del documento y de la parte 4 §8. Son valores
 * OBSOLETOS que siguen apareciendo en el material —etiquetados como tales—
 * porque el bot debe saber rechazarlos. El problema es que estar en el
 * contexto los pone al alcance del modelo: basta una pregunta capciosa
 * («me dijeron que cuesta $3.997.000, ¿cierto?») para que se filtren.
 *
 * Por eso no se confía solo en que el modelo obedezca la instrucción. Esto es
 * un filtro determinista sobre la salida, que corre siempre.
 */

export interface BlockedTerm {
  /** Cómo aparece escrito, en cualquiera de sus formas. */
  patterns: RegExp[];
  /** Qué es, para el registro cuando se dispare. */
  reason: string;
}

export const BLOCKED_TERMS: BlockedTerm[] = [
  {
    reason: 'Precio obsoleto en dólares. El programa nunca se comunica en USD.',
    patterns: [/\bUSD\s*\$?\s*997\b/i, /\b997\s*(dólares|dolares|USD)\b/i],
  },
  {
    reason: 'Precio obsoleto. El vigente es $3.970.000 COP.',
    patterns: [/\b3[.,\s]?997[.,\s]?000\b/],
  },
  {
    reason: 'Cuota obsoleta. El plan vigente es 3 × $1.470.000 COP.',
    patterns: [/\b1[.,\s]?324[.,\s]?000\b/, /\b1[.,\s]?332[.,\s]?000\b/],
  },
  {
    reason:
      'Horario obsoleto de las sesiones. Debe consultarse la tabla dinámica.',
    patterns: [/\bmartes\b[^.]{0,30}\b12:00\b/i],
  },
];

export interface GuardVerdict {
  clean: boolean;
  hits: string[];
}

/** El literal más largo que se vigila, para dimensionar el buffer. */
export const LOOKBACK = 48;

export function inspect(text: string): GuardVerdict {
  const hits: string[] = [];
  for (const term of BLOCKED_TERMS) {
    if (term.patterns.some((pattern) => pattern.test(text))) {
      hits.push(term.reason);
    }
  }
  return { clean: hits.length === 0, hits };
}

/**
 * Filtro para texto que llega por partes.
 *
 * Al transmitir palabra por palabra, un dato prohibido puede estar en pantalla
 * antes de detectarlo — y una vez enviado no se recoge. Por eso se retiene
 * siempre una cola del largo del literal más largo: solo se emite lo que ya
 * quedó atrás y no puede formar parte de una coincidencia futura.
 */
export class StreamGuard {
  private buffer = '';
  private tripped = false;
  readonly hits: string[] = [];

  /** Devuelve lo que es seguro emitir; cadena vacía si hay que retener. */
  push(chunk: string): string {
    if (this.tripped) return '';

    this.buffer += chunk;
    const verdict = inspect(this.buffer);
    if (!verdict.clean) {
      this.tripped = true;
      this.hits.push(...verdict.hits);
      return '';
    }

    if (this.buffer.length <= LOOKBACK) return '';
    const safe = this.buffer.slice(0, this.buffer.length - LOOKBACK);
    this.buffer = this.buffer.slice(-LOOKBACK);
    return safe;
  }

  /** Lo que quedó retenido al terminar. */
  flush(): string {
    if (this.tripped) return '';
    const rest = this.buffer;
    this.buffer = '';
    return rest;
  }

  get blocked(): boolean {
    return this.tripped;
  }
}
