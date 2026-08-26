/**
 * Pliego de blueprint: la planta se traza sobre el papel azul, se levanta en
 * volumen, recibe las cotas del caso, se materializa y por último se repite en
 * rejilla. Es el escenario entero de los Actos 3 y 4.
 *
 * La planta es un apartamento real de 10 x 7 m (dos alcobas, baño, cocina y
 * sala-comedor). Sus vanos están declarados en coordenadas absolutas y de ahí
 * salen tanto el hueco del muro como la marca de carpintería: un muro dibujado
 * en sentido inverso no puede desalinearlos.
 *
 * De la planta se levanta el edificio que la contiene: cinco plantas iguales
 * apiladas sobre la misma huella de 10 x 7 m. Que sea un edificio y no una casa
 * no es un capricho — la planta es un apartamento, y ver cómo se repite cinco
 * veces hacia arriba cuenta la repetición antes de que la rejilla la repita
 * otra vez.
 *
 * No está dibujado a ojo: son las aristas del volumen proyectadas en
 * perspectiva de dos puntos (giro 34°, cámara a 7.2 m de altura y 43 m de
 * distancia). Por eso las verticales quedan verticales y las fugas son
 * consistentes. Las caras del relleno salen de la misma proyección, así que
 * encajan con el trazo sin ajuste manual.
 *
 * Cada trazo es un polígono cerrado con `pathLength={1}`: el dasharray se
 * normaliza y basta animar dashoffset de 1 a 0.
 */

import {
  COMPARABLES,
  COPY,
  COSTS,
  FIGURES,
  UNIT_GAINS,
  type Scene,
} from "./script";

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

const BUILDING_STRUCTURE = [
  "M239.5 318.0 L377.4 300.7 L310.6 287.0 L182.6 300.2 Z",
  "M239.5 42.0 L377.4 60.7 L310.6 75.6 L182.6 61.3 Z",
  "M239.5 318.0 L239.5 42.0",
  "M377.4 300.7 L377.4 60.7",
  "M310.6 287.0 L310.6 75.6",
  "M182.6 300.2 L182.6 61.3",
] as const;

const BUILDING_FLOORS = [
  "M239.5 265.6 L377.4 255.1 L310.6 246.8 L182.6 254.8 Z",
  "M239.5 213.1 L377.4 209.5 L310.6 206.7 L182.6 209.4 Z",
  "M239.5 160.7 L377.4 163.9 L310.6 166.5 L182.6 164.0 Z",
  "M239.5 108.2 L377.4 118.3 L310.6 126.3 L182.6 118.6 Z",
  "M239.5 55.8 L377.4 72.7 L310.6 86.2 L182.6 73.3 Z",
] as const;

const BUILDING_OPENINGS = [
  "M299.3 310.5 L326.8 307.1 L326.8 265.7 L299.3 268.0 Z M252.0 299.2 L282.1 295.9 L282.1 271.2 L252.0 273.7 Z M342.6 289.3 L367.7 286.6 L367.7 263.9 L342.6 266.1 Z M229.4 297.8 L213.9 293.6 L213.9 269.4 L229.4 272.6 Z M204.2 290.9 L190.5 287.2 L190.5 264.4 L204.2 267.3 Z",
  "M297.9 244.6 L328.1 242.8 L328.1 219.2 L297.9 220.3 Z M252.0 247.3 L282.1 245.6 L282.1 220.8 L252.0 221.9 Z M342.6 242.0 L367.7 240.5 L367.7 217.9 L342.6 218.7 Z M229.4 246.6 L213.9 244.3 L213.9 220.1 L229.4 221.4 Z M204.2 242.9 L190.5 240.8 L190.5 218.1 L204.2 219.2 Z",
  "M297.9 195.1 L328.1 194.8 L328.1 171.2 L297.9 170.7 Z M252.0 195.5 L282.1 195.2 L282.1 170.5 L252.0 170.1 Z M342.6 194.7 L367.7 194.4 L367.7 171.8 L342.6 171.4 Z M229.4 195.4 L213.9 195.0 L213.9 170.8 L229.4 170.3 Z M204.2 194.8 L190.5 194.5 L190.5 171.7 L204.2 171.2 Z",
  "M297.9 145.5 L328.1 146.7 L328.1 123.1 L297.9 121.2 Z M252.0 143.7 L282.1 144.9 L282.1 120.2 L252.0 118.2 Z M342.6 147.3 L367.7 148.3 L367.7 125.7 L342.6 124.1 Z M229.4 144.2 L213.9 145.8 L213.9 121.6 L229.4 119.1 Z M204.2 146.7 L190.5 148.1 L190.5 125.3 L204.2 123.1 Z",
  "M297.9 96.0 L328.1 98.7 L328.1 75.1 L297.9 71.7 Z M252.0 91.9 L282.1 94.6 L282.1 69.9 L252.0 66.4 Z M342.6 100.0 L367.7 102.2 L367.7 79.6 L342.6 76.7 Z M229.4 93.0 L213.9 96.5 L213.9 72.3 L229.4 67.9 Z M204.2 98.7 L190.5 101.7 L190.5 79.0 L204.2 75.1 Z",
] as const;

const BUILDING_FACES = [
  { d: "M239.5 318.0 L377.4 300.7 L377.4 60.7 L239.5 42.0 Z", light: 0.19 }, // frente
  { d: "M239.5 318.0 L182.6 300.2 L182.6 61.3 L239.5 42.0 Z", light: 0.1 }, // costado
  { d: "M239.5 42.0 L377.4 60.7 L310.6 75.6 L182.6 61.3 Z", light: 0.3 }, // cubierta
] as const;

/** Etapas del pliego, en el orden en que ocurren. */
export type BlueprintStage =
  | "idle"
  | "plan"
  | "lift"
  | "figures"
  | "material"
  | "grid";

/** Traduce la escena del guion a la etapa del pliego. */
export function stageFor(scene: Scene, reached: (s: Scene) => boolean): BlueprintStage {
  if (!reached("plan")) return "idle";
  if (reached("repeat")) return "grid";
  if (reached("material")) return "material";
  if (reached("listed")) return "figures";
  if (reached("lift")) return "lift";
  return "plan";
}

type Layer = {
  paths: readonly string[];
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

/** El edificio se traza de abajo hacia arriba: estructura, losas, vanos. */
const BUILDING_LAYERS: readonly Layer[] = [
  { paths: BUILDING_STRUCTURE, offset: 200, step: 90, duration: 560, width: 2.2 },
  { paths: BUILDING_FLOORS, offset: 800, step: 110, duration: 480, width: 1.8 },
  { paths: BUILDING_OPENINGS, offset: 1400, step: 100, duration: 420, width: 1.2, opacity: 0.85 },
];

/**
 * Rejillas de la repetición. Las celdas están calculadas contra la mancha real
 * del dibujo (492 x 284 en unidades del viewBox), dejando aire entre columnas
 * y sitio para la etiqueta encima de cada unidad.
 */
const GRIDS = {
  4: { scale: 0.42, xs: [148, 412], ys: [100, 250], label: 20, lift: 70 },
  8: { scale: 0.3, xs: [70, 210, 350, 490], ys: [115, 260], label: 15, lift: 52 },
} as const;

const amount = new Intl.NumberFormat("es-CO");
const price = (v: number) => `$${amount.format(v)}`;

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

type BlueprintSceneProps = {
  stage: BlueprintStage;
  /** Paso de las cotas: 0 publicado · 1 comparables · 2 ajustado · 3 costos · 4 máximo. */
  figureStep: number;
  units: 4 | 8;
  comparables: number;
};

export function BlueprintScene({
  stage,
  figureStep,
  units,
  comparables,
}: BlueprintSceneProps) {
  const built = stage !== "idle" && stage !== "plan";
  const asideways = stage === "figures";
  const grid = GRIDS[units];
  const cells = grid.ys.flatMap((y) => grid.xs.map((x) => ({ x, y })));

  return (
    <div className="bp-sheet" aria-hidden="true">
      <svg viewBox="0 0 560 360" className="block h-auto w-full" fill="none">
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

        {/* La planta: protagonista mientras se traza, huella cuando se levanta,
            y fuera cuando la unidad ya se repitió. */}
        <g
          className="bp-plan"
          data-phase={stage === "grid" ? "gone" : built ? "footprint" : "hero"}
        >
          <Strokes layers={PLAN_LAYERS} on={stage !== "idle"} nonScaling={false} />
        </g>

        {/* El volumen se corre a la izquierda cuando entran las cotas, para
            dejarles la mitad derecha del pliego. */}
        {built && stage !== "grid" && (
          <g className="bp-body" data-aside={asideways ? "true" : "false"}>
            <g className="bp-faces" data-on={stage === "material" ? "true" : "false"}>
              {BUILDING_FACES.map((face) => (
                <path
                  key={face.d}
                  d={face.d}
                  fill="var(--color-marfil)"
                  opacity={face.light}
                />
              ))}
            </g>
            <Strokes layers={BUILDING_LAYERS} on={built} />
          </g>
        )}

        {/* La repetición: la primera unidad viaja a su celda, las demás entran
            ya dibujadas. Cada una suelta un +$ hacia arriba. */}
        {stage === "grid" &&
          cells.map((cell, i) => (
            <g
              key={`${cell.x}-${cell.y}`}
              className="bp-unit"
              data-on="true"
              style={{
                transform: `translate(${cell.x}px, ${cell.y}px) scale(${grid.scale}) translate(-280px, -180px)`,
                transitionDelay: `${i === 0 ? 400 : 900 + (i - 1) * 190}ms`,
              }}
            >
              <g className="bp-faces" data-on="true">
                {BUILDING_FACES.map((face) => (
                  <path key={face.d} d={face.d} fill="var(--color-marfil)" opacity={face.light} />
                ))}
              </g>
              <Strokes layers={BUILDING_LAYERS} on solid />
            </g>
          ))}

        {stage === "grid" &&
          cells.map((cell, i) => (
            <text
              key={`p-${cell.x}-${cell.y}`}
              x={cell.x}
              y={cell.y - grid.lift}
              textAnchor="middle"
              className="bp-plus tabular-nums"
              style={{ animationDelay: `${1200 + i * 190}ms` }}
              fill="var(--color-dorado)"
              fontSize={grid.label}
            >
              +{price(UNIT_GAINS[i])}
            </text>
          ))}
      </svg>

      {/* Las cotas del caso, colgadas a la derecha con su línea guía. */}
      <div className="cotas" data-on={asideways ? "true" : "false"}>
        <span className="cota-guide" />

        <p className="cota" data-on={figureStep >= 0 ? "true" : "false"}>
          <span className="cota-fig" data-struck={figureStep >= 2 ? "true" : "false"}>
            {price(FIGURES.listedPrice)}
          </span>
          <span className="cota-tag">{COPY.listed}</span>
        </p>

        <ul className="cota-list" data-on={figureStep >= 1 ? "true" : "false"}>
          <li className="cota-tag">{COPY.compsLead}</li>
          {COMPARABLES.slice(0, comparables).map((c, i) => (
            <li key={c.label} style={{ animationDelay: `${i * 180}ms` }}>
              <span>{c.label}</span>
              <span className="tabular-nums">{price(c.perM2)}/m²</span>
            </li>
          ))}
        </ul>

        <p className="cota" data-on={figureStep >= 2 ? "true" : "false"}>
          <span className="cota-fig">{price(FIGURES.adjustedPrice)}</span>
          <span className="cota-tag">{COPY.adjusted}</span>
        </p>

        <ul className="cota-costs" data-on={figureStep >= 3 ? "true" : "false"}>
          {COSTS.map((c, i) => (
            <li key={c} style={{ animationDelay: `${i * 160}ms` }}>
              {c}
            </li>
          ))}
        </ul>

        <p className="cota-max" data-on={figureStep >= 4 ? "true" : "false"}>
          <span className="cota-fig">{price(FIGURES.maxPrice)}</span>
          <span className="cota-tag">{COPY.maxPrice}</span>
        </p>
      </div>
    </div>
  );
}
