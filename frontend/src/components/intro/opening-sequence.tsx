"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { createIntroAudio, type IntroAudio } from "./audio";
import { BlueprintScene, type BlueprintStage } from "./blueprint-scene";
import {
  COPY,
  FIGURES,
  MOBILE_FACTOR,
  SCRIPT,
  SEEN_KEY,
  type Scene,
} from "./script";

/** Orden narrativo, para poder preguntar "¿ya pasamos por acá?". */
const ORDER: readonly Scene[] = [
  "gate",
  "worked",
  "remaining",
  "pension",
  "break",
  "plan",
  "build",
  "multiply",
  "promise",
  "brand",
];

const decimal = new Intl.NumberFormat("es-CO");
const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Escribe el texto carácter a carácter. Devuelve el trozo ya escrito. */
function useTypewriter(text: string, active: boolean, charMs: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, charMs);
    return () => window.clearInterval(id);
  }, [text, active, charMs]);

  const shown = active ? count : 0;
  return { typed: text.slice(0, shown), done: shown >= text.length };
}

/** Sube un contador hasta `target` y frena, como un marcador mecánico. */
function useCountUp(target: number, active: boolean, durationMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // arranca rápido, se asienta
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs]);

  return active ? value : 0;
}

/**
 * El script inline de layout.tsx marca `data-intro="pending"` antes de que
 * React hidrate. Se lee como store externo — no como estado propio — porque en
 * el servidor no existe: la instantánea de servidor siempre es `false` y la de
 * cliente lee el DOM. El atributo no cambia solo, así que no hay a qué
 * suscribirse.
 */
function useIntroPending() {
  return useSyncExternalStore(
    () => () => {},
    () => document.documentElement.dataset.intro === "pending",
    () => false,
  );
}

export function OpeningSequence() {
  // -1 es la compuerta; a partir de 0 se recorre SCRIPT.
  const [index, setIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [factor, setFactor] = useState(1);
  const [muted, setMuted] = useState(false);
  const audio = useRef<IntroAudio | null>(null);

  // Se arma solo si el visitante no la ha visto ni pidió menos movimiento.
  const armed = useIntroPending() && !dismissed;

  // En móvil está el grueso del tráfico: misma narrativa, ~10 s en vez de ~16.
  const start = useCallback(() => {
    setFactor(
      window.matchMedia("(max-width: 767px)").matches ? MOBILE_FACTOR : 1,
    );
    // El AudioContext debe nacer dentro del gesto: fuera de él no suena.
    audio.current ??= createIntroAudio();
    setIndex(0);
  }, []);

  const scene: Scene = index < 0 ? "gate" : SCRIPT[index].scene;
  const reached = useCallback(
    (s: Scene) => ORDER.indexOf(scene) >= ORDER.indexOf(s),
    [scene],
  );

  const totalMs = useMemo(
    () => SCRIPT.reduce((sum, beat) => sum + (beat.ms ?? 0), 0) * factor,
    [factor],
  );

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Navegación privada o almacenamiento bloqueado: se verá otra vez, y ya.
    }
    delete document.documentElement.dataset.intro;
    audio.current?.close();
    audio.current = null;
    setDismissed(true);
  }, []);

  // Avance del guion, un beat a la vez. La última escena espera al usuario.
  useEffect(() => {
    if (!armed || index < 0 || index >= SCRIPT.length) return;
    const { ms } = SCRIPT[index];
    if (ms === null) return;
    const id = window.setTimeout(() => setIndex((i) => i + 1), ms * factor);
    return () => window.clearTimeout(id);
  }, [armed, index, factor]);

  useEffect(() => {
    audio.current?.setMuted(muted);
  }, [muted]);

  // El tic de reloj acompaña a las tres primeras escenas y se acelera cuando
  // el contador arranca: el tiempo se siente correr más rápido de lo que va.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (scene !== "worked" && scene !== "remaining" && scene !== "pension") {
      return;
    }
    a.cue("tick");
    const period = (scene === "remaining" ? 560 : 900) * factor;
    const id = window.setInterval(() => a.cue("tick"), period);
    return () => window.clearInterval(id);
  }, [scene, factor]);

  // Un disparo por escena, y cuatro en la rejilla — uno por unidad que aterriza.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (scene === "pension") a.pad(true);
    if (scene === "break") {
      a.pad(false);
      a.cue("fracture");
    }
    if (scene === "plan" || scene === "build") a.cue("draw");
    if (scene === "brand") a.cue("chime");
    if (scene !== "multiply") return;
    const ids = [1700, 2200, 2580, 2960].map((at) =>
      window.setTimeout(() => a.cue("unit"), at * factor),
    );
    return () => ids.forEach(window.clearTimeout);
  }, [scene, factor]);

  // Escape salta la secuencia; el scroll queda bloqueado mientras corre.
  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [armed, dismiss]);

  const running = index >= 0;
  const worked = useTypewriter(COPY.worked, reached("worked"), 46);
  const remaining = useCountUp(
    FIGURES.daysRemaining,
    reached("remaining"),
    2600 * factor,
  );
  const planLine = useTypewriter(COPY.plan, reached("plan"), 48);
  const buildLine = useTypewriter(COPY.build, reached("build"), 48);
  const multiplyLine = useTypewriter(COPY.multiply, reached("multiply"), 42);

  const blueprintStage: BlueprintStage = !reached("plan")
    ? "idle"
    : reached("promise")
      ? "shield"
      : reached("multiply")
        ? "multiply"
        : reached("build")
          ? "build"
          : "plan";

  if (!armed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Secuencia de apertura"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-obsidiana px-6 text-center"
    >
      {/* Viñeta suave. Sin scanlines, sin glitch: la quietud es el punto. */}
      <div className="intro-vignette" aria-hidden="true" />

      {/* ---------- HUD: el sistema, ya corriendo ---------- */}
      <p className="absolute left-6 top-6 text-left text-xs tracking-[0.14em] text-grafito-texto">
        sistema pensional: <span className="text-dorado">cotizando</span>
        <span className="mx-2 text-grafito">·</span>
        semanas:{" "}
        <span className="text-dorado tabular-nums">
          {decimal.format(FIGURES.weeksRequired)}
        </span>
      </p>

      {/* ---------- Escenas 1–4: el contador ---------- */}
      {running && !reached("plan") && (
        <div className="flex max-w-3xl flex-col items-center gap-7">
          <p className="font-display text-2xl leading-snug text-marfil md:text-4xl">
            {worked.typed}
            {!worked.done && <span className="intro-caret" />}
          </p>

          {reached("remaining") && (
            <p className="intro-rise font-display text-2xl leading-snug text-marfil md:text-4xl">
              {COPY.remaining}{" "}
              <span className="tabular-nums text-dorado">
                {decimal.format(remaining)}
              </span>{" "}
              {COPY.remainingTail}
            </p>
          )}

          {reached("pension") && (
            <div className="intro-rise mt-4">
              <p className="text-base text-grafito-texto md:text-lg">
                {COPY.pension}
              </p>
              <p
                className="intro-figure font-display text-5xl tabular-nums leading-none text-marfil md:text-7xl"
                data-broken={reached("break") ? "true" : "false"}
              >
                <span className="intro-figure-top">
                  {currency.format(FIGURES.monthlyPension)}
                </span>
                <span className="intro-figure-bottom" aria-hidden="true">
                  {currency.format(FIGURES.monthlyPension)}
                </span>
              </p>
              <p className="mt-3 text-base text-grafito-texto md:text-lg">
                {COPY.pensionTail}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------- Escenas 5–6: el plano ---------- */}
      {reached("plan") && !reached("brand") && (
        <div className="flex w-full max-w-3xl flex-col items-center gap-8">
          <p className="font-display text-xl leading-snug text-marfil md:text-3xl">
            {reached("multiply") ? (
              <>
                {multiplyLine.typed}
                {!multiplyLine.done && <span className="intro-caret" />}
              </>
            ) : reached("build") ? (
              <>
                {buildLine.typed}
                {!buildLine.done && <span className="intro-caret" />}
              </>
            ) : (
              <>
                {planLine.typed}
                {!planLine.done && <span className="intro-caret" />}
              </>
            )}
          </p>

          <BlueprintScene stage={blueprintStage} />

          {reached("promise") && (
            <p className="intro-rise max-w-xl text-base leading-relaxed text-marfil/80 md:text-lg">
              {COPY.promise}
            </p>
          )}
        </div>
      )}

      {/* ---------- Escena 7: reveal de marca ---------- */}
      {reached("brand") && (
        <div className="intro-bloom flex flex-col items-center gap-8">
          <h2 className="font-display text-3xl leading-tight text-oro md:text-5xl">
            {COPY.brand}
          </h2>
          <Link
            href="/indice"
            onClick={dismiss}
            className="rounded-md bg-dorado px-8 py-4 font-medium text-obsidiana transition-colors hover:bg-oro"
          >
            {COPY.cta}
          </Link>
          <p className="text-sm text-grafito-texto">{COPY.ctaNote}</p>
        </div>
      )}

      {/* ---------- Compuerta ---------- */}
      {!running && (
        <button
          type="button"
          onClick={start}
          className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-5 bg-obsidiana"
        >
          <span className="intro-breathe grid size-20 place-items-center rounded-full border border-grafito/40 text-dorado">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
          </span>
          <span className="font-display text-xl uppercase tracking-[0.16em] text-dorado md:text-2xl">
            {COPY.gateTitle}
          </span>
          <span className="text-sm tracking-[0.08em] text-grafito-texto">
            {COPY.gateHint}
          </span>
        </button>
      )}

      {/* ---------- Silencio ---------- */}
      {running && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? COPY.unmute : COPY.mute}
          className="absolute right-6 top-6 z-20 grid size-10 place-items-center rounded-md border border-grafito/40 text-grafito-texto transition-colors hover:border-dorado hover:text-dorado"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M11 5 6 9H3v6h3l5 4z" />
            {muted ? (
              <path d="m22 9-6 6M16 9l6 6" />
            ) : (
              <path d="M16 9a4 4 0 0 1 0 6" />
            )}
          </svg>
        </button>
      )}

      {/* ---------- Escape, visible desde el segundo cero ---------- */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute bottom-6 right-6 z-20 rounded-md border border-grafito/40 px-4 py-2 text-sm tracking-[0.1em] text-grafito-texto transition-colors hover:border-dorado hover:text-dorado"
      >
        {COPY.skip} ▸
      </button>

      {/* ---------- Progreso de la narración ---------- */}
      {running && (
        <span
          className="intro-progress"
          style={{ animationDuration: `${totalMs}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
