/**
 * Pliego de blueprint: la planta se traza sobre el papel azul y, cuando la
 * narración lo pide, se estructura en la casa en perspectiva mientras la
 * planta retrocede al fondo — la huella queda debajo de lo construido.
 *
 * La planta es un apartamento real de 10 × 7 m (dos alcobas, baño, cocina y
 * sala-comedor), con la misma huella que la casa para que el paso de una a
 * otra se lea como el mismo edificio. Sus vanos están declarados en
 * coordenadas absolutas y de ahí salen tanto el hueco del muro como la marca
 * de carpintería: un muro dibujado en sentido inverso no puede desalinearlos.
 *
 * La geometría de la casa no está dibujada a ojo: son las aristas de un
 * volumen de 10 × 7 × 4 m con cumbrera a 6.6 m, proyectadas en perspectiva de
 * dos puntos (giro 34°, cámara a 2.3 m y 27 m de distancia). Por eso las
 * verticales quedan verticales y las fugas son consistentes.
 *
 * Cada trazo es un polígono cerrado con `pathLength={1}`: el dasharray se
 * normaliza y basta animar dashoffset de 1 a 0. Agrupar los rectángulos en un
 * solo path deja 23 trazos en vez de 61, y cada capa se lee como un gesto
 * único en vez de como veintitantas animaciones sueltas.
 */

import { FIGURES } from "./script";

const PLAN_WALLS = [
  "M70.0 33.0 L112.0 33.0 M179.2 33.0 L347.2 33.0 M439.6 33.0 L490.0 33.0",
  "M490.0 33.0 L490.0 75.0 M490.0 133.8 L490.0 217.8 M490.0 285.0 L490.0 327.0",
  "M70.0 327.0 L128.8 327.0 M229.6 327.0 L271.6 327.0 M313.6 327.0 L372.4 327.0 M439.6 327.0 L490.0 327.0",
  "M70.0 33.0 L70.0 75.0 M70.0 133.8 L70.0 217.8 M70.0 293.4 L70.0 327.0",
  "M221.2 33.0 L221.2 184.2",
  "M305.2 33.0 L305.2 184.2",
  "M70.0 184.2 L128.8 184.2 M166.6 184.2 L246.4 184.2 M275.8 184.2 L364.0 184.2 M401.8 184.2 L490.0 184.2",
  "M338.8 184.2 L338.8 201.0 M338.8 251.4 L338.8 327.0",
] as const;

const PLAN_DOORS = [
  "M128.8 184.2 L128.8 146.4 M166.6 184.2 A 37.8 37.8 0 0 0 128.8 146.4 M275.8 184.2 L275.8 154.8 M246.4 184.2 A 29.4 29.4 0 0 1 275.8 154.8 M364.0 184.2 L364.0 146.4 M401.8 184.2 A 37.8 37.8 0 0 0 364.0 146.4 M313.6 327.0 L313.6 285.0 M271.6 327.0 A 42.0 42.0 0 0 1 313.6 285.0",
  "M112.0 30.1 L179.2 30.1 M112.0 35.9 L179.2 35.9 M347.2 30.1 L439.6 30.1 M347.2 35.9 L439.6 35.9 M128.8 324.1 L229.6 324.1 M128.8 329.9 L229.6 329.9 M372.4 324.1 L439.6 324.1 M372.4 329.9 L439.6 329.9 M487.1 75.0 L487.1 133.8 M492.9 75.0 L492.9 133.8 M487.1 217.8 L487.1 285.0 M492.9 217.8 L492.9 285.0 M67.1 75.0 L67.1 133.8 M72.9 75.0 L72.9 133.8 M67.1 217.8 L67.1 293.4 M72.9 217.8 L72.9 293.4",
] as const;

const PLAN_FIXTURES = [
  "M149.8 43.5 L212.8 43.5 L212.8 127.5 L149.8 127.5 Z M149.8 64.5 L212.8 64.5 M122.5 43.5 L143.5 43.5 L143.5 64.5 L122.5 64.5 Z M401.8 45.6 L473.2 45.6 L473.2 131.7 L401.8 131.7 Z M401.8 68.7 L473.2 68.7 M475.3 45.6 L487.9 45.6 L487.9 64.5 L475.3 64.5 Z M311.5 43.5 L385.0 43.5 L385.0 66.6 L311.5 66.6 Z M311.5 66.6 L385.0 66.6",
  "M227.5 45.6 L298.9 45.6 L298.9 98.1 L227.5 98.1 Z M227.5 45.6 L298.9 98.1 M227.5 114.9 L246.4 114.9 L246.4 142.2 L227.5 142.2 Z M273.7 114.9 L298.9 114.9 L298.9 132.5 L273.7 132.5 Z",
  "M347.2 190.5 L487.9 190.5 L487.9 224.1 L347.2 224.1 Z M454.3 224.1 L487.9 224.1 L487.9 308.1 L454.3 308.1 Z M357.7 198.9 L391.3 198.9 L391.3 215.7 L357.7 215.7 Z M422.8 200.2 a 6.3 6.3 0 1 0 12.6 0 a 6.3 6.3 0 1 0 -12.6 0 M443.8 200.2 a 6.3 6.3 0 1 0 12.6 0 a 6.3 6.3 0 1 0 -12.6 0 M422.8 214.4 a 6.3 6.3 0 1 0 12.6 0 a 6.3 6.3 0 1 0 -12.6 0 M443.8 214.4 a 6.3 6.3 0 1 0 12.6 0 a 6.3 6.3 0 1 0 -12.6 0",
  "M93.1 278.7 L185.5 278.7 L185.5 314.4 L93.1 314.4 Z M93.1 303.9 L185.5 303.9 M114.1 232.5 L160.3 232.5 L160.3 259.8 L114.1 259.8 Z M231.7 217.8 L298.9 217.8 L298.9 257.7 L231.7 257.7 Z M235.9 203.1 L261.1 203.1 L261.1 215.7 L235.9 215.7 Z M269.5 203.1 L294.7 203.1 L294.7 215.7 L269.5 215.7 Z M235.9 259.8 L261.1 259.8 L261.1 272.4 L235.9 272.4 Z M269.5 259.8 L294.7 259.8 L294.7 272.4 L269.5 272.4 Z",
] as const;

const HOUSE_STRUCTURE = [
  "M176.5 321.9 L501.9 299.8 L344.0 284.8 L55.7 299.1 Z",
  "M176.5 136.5 L501.9 152.9 L344.0 164.0 L55.7 153.4 Z",
  "M176.5 321.9 L176.5 136.5",
  "M501.9 299.8 L501.9 152.9",
  "M344.0 284.8 L344.0 164.0",
  "M55.7 299.1 L55.7 153.4",
] as const;

const HOUSE_ROOF = [
  "M91.7 38.1 L426.4 74.0",
  "M167.7 134.2 L91.7 38.1 L34.0 153.7",
  "M526.0 152.6 L426.4 74.0 L346.4 165.0",
  "M167.7 134.2 L526.0 152.6",
  "M34.0 153.7 L346.4 165.0",
] as const;

const HOUSE_OPENINGS = [
  "M328.6 311.6 L386.4 307.6 L386.4 207.3 L328.6 207.0 Z",
  "M220.4 260.4 L287.2 258.4 L287.2 180.9 L220.4 179.3 Z",
  "M422.4 254.4 L472.9 252.9 L472.9 185.3 L422.4 184.1 Z",
  "M151.3 259.6 L121.1 257.1 L121.1 181.9 L151.3 179.9 Z",
  "M97.2 255.2 L72.6 253.1 L72.6 185.1 L97.2 183.5 Z",
  "M126.5 126.6 L92.4 132.5 L92.4 85.2 L126.5 75.9 Z",
] as const;

/** Etapas del pliego, en el orden en que ocurren. */
export type BlueprintStage = "idle" | "plan" | "build" | "multiply" | "shield";

type Layer = {
  paths: readonly string[];
  /** Retraso de la capa completa, ya dentro de su etapa. */
  offset: number;
  step: number;
  duration: number;
  width: number;
  opacity?: number;
};

const PLAN_LAYERS: readonly Layer[] = [
  { paths: PLAN_WALLS, offset: 0, step: 180, duration: 800, width: 6 },
  { paths: PLAN_DOORS, offset: 1500, step: 200, duration: 650, width: 1.2, opacity: 0.9 },
  { paths: PLAN_FIXTURES, offset: 1900, step: 170, duration: 620, width: 1.2, opacity: 0.8 },
];

const HOUSE_LAYERS: readonly Layer[] = [
  { paths: HOUSE_STRUCTURE, offset: 800, step: 110, duration: 720, width: 2.2 },
  { paths: HOUSE_ROOF, offset: 1800, step: 110, duration: 680, width: 2.2 },
  { paths: HOUSE_OPENINGS, offset: 2500, step: 90, duration: 560, width: 1.3, opacity: 0.85 },
];

/**
 * Rejilla 2×2 sobre el pliego. Las celdas están calculadas contra la mancha
 * real del dibujo (492 × 284 en unidades del viewBox): a escala 0.40 cada
 * unidad ocupa 197 × 114, lo que deja 68 px de aire entre columnas y 40 entre
 * filas, y sitio para la etiqueta debajo sin pisar la fila siguiente.
 */
const CELL_SCALE = 0.4;
const CELLS = [
  { x: 148, y: 96 },
  { x: 412, y: 96 },
  { x: 148, y: 250 },
  { x: 412, y: 250 },
] as const;

// Se compone a mano en vez de usar `style: "currency"`: el formato es-CO
// intercala un espacio ("$ 1.200.000") que aquí estorba junto al signo +.
const amount = new Intl.NumberFormat("es-CO");

function Strokes({
  layers,
  on,
  solid = false,
  nonScaling = true,
}: {
  layers: readonly Layer[];
  on: boolean;
  /** El clon no se vuelve a trazar: nace dibujado y solo entra en escena. */
  solid?: boolean;
  /** Grosor de línea constante. La casa sí; la planta engorda con su escala. */
  nonScaling?: boolean;
}) {
  return (
    <>
      {layers.map((layer) =>
        layer.paths.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className={solid ? "bp-solid" : "bp-draw"}
            data-on={on ? "true" : "false"}
            style={
              solid
                ? undefined
                : {
                    animationDelay: `${layer.offset + i * layer.step}ms`,
                    animationDuration: `${layer.duration}ms`,
                  }
            }
            stroke="var(--color-marfil)"
            strokeWidth={layer.width}
            opacity={layer.opacity ?? 1}
            vectorEffect={nonScaling ? "non-scaling-stroke" : undefined}
          />
        )),
      )}
    </>
  );
}

export function BlueprintScene({ stage }: { stage: BlueprintStage }) {
  const building = stage === "build" || stage === "multiply" || stage === "shield";
  const multiplying = stage === "multiply" || stage === "shield";

  return (
    <div className="bp-sheet" aria-hidden="true">
      <svg viewBox="0 0 560 360" className="block h-auto w-full" fill="none">
        {/* Retícula del pliego: decorativa y quieta, nunca animada. */}
        <defs>
          <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0 H0 V20"
              fill="none"
              stroke="var(--color-marfil)"
              strokeWidth="0.5"
              opacity="0.12"
            />
          </pattern>
        </defs>
        <rect width="560" height="360" fill="url(#bp-grid)" />

        {/* La planta: protagonista mientras se traza, huella cuando se
            construye, y fuera cuando la unidad ya se repitió. */}
        <g
          className="bp-plan"
          data-phase={multiplying ? "gone" : building ? "footprint" : "hero"}
        >
          <Strokes layers={PLAN_LAYERS} on={stage !== "idle"} nonScaling={false} />
        </g>

        {/* La unidad. La primera se traza capa por capa; las demás son clones
            que entran ya dibujados cuando la rejilla se puebla. */}
        {CELLS.map((cell, i) => (
          <g
            key={`${cell.x}-${cell.y}`}
            className="bp-unit"
            data-on={(i === 0 ? building : multiplying) ? "true" : "false"}
            style={{
              transform: multiplying
                ? `translate(${cell.x}px, ${cell.y}px) scale(${CELL_SCALE}) translate(-280px, -180px)`
                : "none",
              // La casa ya trazada se sostiene medio segundo en el centro
              // antes de viajar: sin esa pausa nunca se la ve entera y sola.
              transitionDelay: multiplying
                ? `${i === 0 ? 500 : 1500 + (i - 1) * 380}ms`
                : "0ms",
            }}
          >
            <Strokes layers={HOUSE_LAYERS} on={i === 0 ? building : multiplying} solid={i > 0} />
          </g>
        ))}

        {/* Renta por unidad. En marfil, no en oro: el oro está reservado al
            resultado del Índice y el dorado al blindaje. */}
        {CELLS.map((cell, i) => (
          <text
            key={`t-${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y + 72}
            textAnchor="middle"
            className="bp-label"
            data-on={multiplying ? "true" : "false"}
            style={{ animationDelay: `${1900 + i * 380}ms` }}
            fill="var(--color-marfil)"
            fontSize="15"
          >
            +${amount.format(FIGURES.monthlyIncomes[i])}/mes
          </text>
        ))}

        {/* El blindaje: el único dorado del pliego, y llega al final. */}
        <rect
          x="5"
          y="5"
          width="550"
          height="350"
          rx="4"
          pathLength={1}
          className="bp-shield"
          data-on={stage === "shield" ? "true" : "false"}
          stroke="var(--color-dorado)"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
