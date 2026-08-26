/**
 * El signo $ que los gastos se comen.
 *
 * Es el objeto que rima: aparece en el Acto 1, vuelve idéntico en el Acto 2
 * para probar que la pensión es el mismo Día 30, y regresa una tercera vez en
 * el Acto 4 — misma tipografía, mismo tamaño, misma posición — pero esa vez
 * aguanta. Por eso vive en su propio componente y no incrustado en una escena:
 * la única forma de que la rima funcione es que sea literalmente el mismo
 * elemento, no tres parecidos.
 *
 * La erosión son seis copias del glifo recortadas con `clip-path`, apiladas de
 * modo que juntas forman uno solo. Quitar un gasto suelta una franja, que cae
 * con su propio impulso. Las líneas de fractura y los impulsos se generaron
 * con semilla fija: nada de aleatoriedad en tiempo de ejecución, que haría el
 * dibujo distinto en cada carga.
 */

const SLABS = [
  "polygon(0.0% 0.0%, 20.0% 0.0%, 40.0% 0.0%, 60.0% 0.0%, 80.0% 0.0%, 100.0% 0.0%, 100.0% 15.5%, 80.0% 17.0%, 60.0% 12.8%, 40.0% 18.0%, 20.0% 13.5%, 0.0% 15.1%)",
  "polygon(0.0% 15.1%, 20.0% 13.5%, 40.0% 18.0%, 60.0% 12.8%, 80.0% 17.0%, 100.0% 15.5%, 100.0% 29.6%, 80.0% 29.5%, 60.0% 32.7%, 40.0% 29.2%, 20.0% 33.4%, 0.0% 29.4%)",
  "polygon(0.0% 29.4%, 20.0% 33.4%, 40.0% 29.2%, 60.0% 32.7%, 80.0% 29.5%, 100.0% 29.6%, 100.0% 54.0%, 80.0% 51.1%, 60.0% 47.5%, 40.0% 46.6%, 20.0% 52.9%, 0.0% 49.3%)",
  "polygon(0.0% 49.3%, 20.0% 52.9%, 40.0% 46.6%, 60.0% 47.5%, 80.0% 51.1%, 100.0% 54.0%, 100.0% 64.8%, 80.0% 69.9%, 60.0% 62.6%, 40.0% 71.0%, 20.0% 65.7%, 0.0% 67.4%)",
  "polygon(0.0% 67.4%, 20.0% 65.7%, 40.0% 71.0%, 60.0% 62.6%, 80.0% 69.9%, 100.0% 64.8%, 100.0% 84.1%, 80.0% 80.5%, 60.0% 86.2%, 40.0% 81.6%, 20.0% 79.9%, 0.0% 80.1%)",
  "polygon(0.0% 80.1%, 20.0% 79.9%, 40.0% 81.6%, 60.0% 86.2%, 80.0% 80.5%, 100.0% 84.1%, 100.0% 100.0%, 80.0% 100.0%, 60.0% 100.0%, 40.0% 100.0%, 20.0% 100.0%, 0.0% 100.0%)",
] as const;

const SHARDS = [
  { x: -22, y: 215, rot: -26 },
  { x: 70, y: 136, rot: 34 },
  { x: -55, y: 172, rot: 25 },
  { x: 66, y: 229, rot: 2 },
  { x: 49, y: 236, rot: 8 },
  { x: 6, y: 183, rot: -15 },
] as const;

export const SLAB_COUNT = SLABS.length;

type MoneyGlyphProps = {
  /** Cuántas franjas ya se desprendieron. */
  eaten: number;
  /** El $ colapsó: queda el cero. */
  collapsed?: boolean;
  /** Acto 4: los gastos llegan pero no se llevan nada. */
  holding?: boolean;
};

export function MoneyGlyph({
  eaten,
  collapsed = false,
  holding = false,
}: MoneyGlyphProps) {
  if (collapsed) {
    return (
      <span className="glyph-zero font-display tabular-nums" aria-hidden="true">
        0
      </span>
    );
  }

  return (
    <span className="glyph" data-holding={holding ? "true" : "false"}>
      {SLABS.map((clip, i) => {
        const gone = i < eaten;
        const shard = SHARDS[i];
        return (
          <span
            key={clip}
            className="glyph-slab font-display"
            data-gone={gone ? "true" : "false"}
            style={{
              clipPath: clip,
              // El impulso solo se aplica cuando la franja ya se soltó; en
              // reposo debe ser `none` o la transición no tiene de dónde salir.
              transform: gone
                ? `translate(${shard.x}px, ${shard.y}px) rotate(${shard.rot}deg)`
                : undefined,
            }}
          >
            $
          </span>
        );
      })}
      {/* Copia accesible sin recortar: los lectores de pantalla no deben oír
          seis dólares seguidos. */}
      <span className="sr-only">$</span>
    </span>
  );
}
