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
import { BlueprintScene, stageFor } from "./blueprint-scene";
import { MethodLine } from "./method-line";
import { MoneyGlyph, SLAB_COUNT } from "./money-glyph";
import {
  COPY,
  DESKTOP_UNITS,
  DRAIN_SCENES,
  EXPENSES,
  FIGURES,
  MOBILE_COMPARABLES,
  MOBILE_FACTOR,
  MOBILE_UNITS,
  ORDER,
  SCRIPT,
  SEEN_KEY,
  COMPARABLES,
  type Scene,
} from "./script";

const decimal = new Intl.NumberFormat("es-CO");
const price = (v: number) => `$${decimal.format(v)}`;

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

/** Sube un contador hasta `target` y frena en seco. */
function useCountUp(target: number, active: boolean, durationMs: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs]);
  return active ? value : 0;
}

/**
 * Cuenta cuántas franjas del $ se ha llevado ya el desfile de gastos.
 * Devuelve también el gasto que está entrando, para poder rotularlo.
 */
function useDrain(active: boolean, totalMs: number) {
  const [eaten, setEaten] = useState(0);
  useEffect(() => {
    if (!active) return;
    const step = totalMs / SLAB_COUNT;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setEaten(i);
      if (i >= SLAB_COUNT) window.clearInterval(id);
    }, step);
    return () => window.clearInterval(id);
  }, [active, totalMs]);
  return active ? eaten : 0;
}

/**
 * El script inline de layout.tsx marca `data-intro="pending"` antes de que
 * React hidrate. Se lee como store externo — no como estado propio — porque en
 * el servidor no existe: la instantánea de servidor siempre es `false` y la de
 * cliente lee el DOM.
 */
function useIntroPending() {
  return useSyncExternalStore(
    () => () => {},
    () => document.documentElement.dataset.intro === "pending",
    () => false,
  );
}

export function OpeningSequence() {
  const [index, setIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [muted, setMuted] = useState(false);
  const audio = useRef<IntroAudio | null>(null);

  const armed = useIntroPending() && !dismissed;
  const factor = mobile ? MOBILE_FACTOR : 1;

  // En móvil se recorta estructura, no solo tiempos: un ciclo menos.
  const beats = useMemo(
    () => SCRIPT.filter((b) => !(mobile && b.skipOnMobile)),
    [mobile],
  );

  const start = useCallback(() => {
    setMobile(window.matchMedia("(max-width: 767px)").matches);
    // El AudioContext debe nacer dentro del gesto: fuera de él no suena.
    audio.current ??= createIntroAudio();
    setIndex(0);
  }, []);

  const scene: Scene = index < 0 ? "gate" : beats[index].scene;
  const act = index < 0 ? 1 : beats[index].act;
  const reached = useCallback(
    (s: Scene) => ORDER.indexOf(scene) >= ORDER.indexOf(s),
    [scene],
  );

  /**
   * Duración del beat en curso. De acá salen tanto la erosión del $ como el
   * desfile de clicks: antes vivían en dos tablas distintas y alargar una
   * escena desincronizaba el sonido de la imagen.
   */
  const beatMs = index >= 0 ? (beats[index].ms ?? 0) : 0;
  const draining = DRAIN_SCENES.includes(scene);
  // Termina algo antes que el beat, para ver el $ ya devorado un instante.
  const drainMs = draining ? beatMs * 0.85 : 0;

  const totalMs = useMemo(
    () => beats.reduce((sum, b) => sum + (b.ms ?? 0), 0) * factor,
    [beats, factor],
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
    if (!armed || index < 0 || index >= beats.length) return;
    const { ms } = beats[index];
    if (ms === null) return;
    const id = window.setTimeout(() => setIndex((i) => i + 1), ms * factor);
    return () => window.clearTimeout(id);
  }, [armed, index, beats, factor]);

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

  useEffect(() => {
    audio.current?.setMuted(muted);
  }, [muted]);


  /**
   * Las notas que caen. Van sobre `act`, no sobre `scene`: si dependieran de
   * la escena, cada corte reiniciaría el intervalo y con escenas de dos
   * segundos no llegaría a sonar ninguna.
   */
  const silent = scene === "rupture";
  useEffect(() => {
    const a = audio.current;
    if (!a || act > 2 || silent) return;
    const id = window.setInterval(() => a.descend(), 4600 * factor);
    return () => window.clearInterval(id);
  }, [act, silent, factor]);

  // El tic de reloj vive en el Acto 1 y se acelera cuando arranca el contador.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (scene !== "worked" && scene !== "remaining") return;
    a.cue("tick");
    const period = (scene === "remaining" ? 560 : 950) * factor;
    const id = window.setInterval(() => a.cue("tick"), period);
    return () => window.clearInterval(id);
  }, [scene, factor]);

  // Un disparo por escena, y los desfiles de clicks donde hay gastos llegando.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const parade =
      draining ? drainMs
      : scene === "hold" ? beatMs * 0.7
      : 0;
    if (parade > 0) {
      const step = (parade * factor) / SLAB_COUNT;
      const ids = Array.from({ length: SLAB_COUNT }, (_, i) =>
        window.setTimeout(() => a.cue("click"), step * (i + 1)),
      );
      if (scene === "hold") {
        // El $ aguanta: en vez de romperse, se asienta.
        ids.push(window.setTimeout(() => a.cue("hold"), 400 * factor));
      }
      return () => ids.forEach(window.clearTimeout);
    }
    if (scene === "zero" || scene === "pensionZero") {
      a.cue("collapse");
      // El suspiro entra cuando el cero ya está en pantalla, no encima del golpe.
      const id = window.setTimeout(() => a.cue("sigh"), 700 * factor);
      return () => window.clearTimeout(id);
    }
    if (scene === "weeks") a.cue("calc");
    if (scene === "rupture") {
      a.cue("glitch");
      // El silencio absoluto arranca apenas pasa el glitch y es lo único que
      // suena —o deja de sonar— durante un segundo entero.
      const id = window.setTimeout(() => a.silence(true), 160 * factor);
      return () => window.clearTimeout(id);
    }
    if (scene === "other") a.silence(false);
    if (scene === "plan" || scene === "lift") a.cue("draw");
    if (scene === "listed" || scene === "costs") a.cue("snap");
    if (scene === "material") a.cue("snap");
    if (scene === "method") a.cue("snap");
    if (scene === "brand") a.cue("chime");
  }, [scene, factor, draining, drainMs, beatMs]);

  useEffect(() => {
    const a = audio.current;
    if (!a || scene !== "comps") return;
    const n = mobile ? MOBILE_COMPARABLES : COMPARABLES.length;
    const ids = Array.from({ length: n }, (_, i) =>
      window.setTimeout(() => a.cue("calc"), (300 + i * 380) * factor),
    );
    return () => ids.forEach(window.clearTimeout);
  }, [scene, factor, mobile]);

  useEffect(() => {
    const a = audio.current;
    if (!a || scene !== "repeat") return;
    const n = mobile ? MOBILE_UNITS : DESKTOP_UNITS;
    const ids = Array.from({ length: n }, (_, i) =>
      window.setTimeout(() => a.cue("unit"), (500 + i * 190) * factor),
    );
    return () => ids.forEach(window.clearTimeout);
  }, [scene, factor, mobile]);

  // ---------- Texto y cifras ----------
  const running = index >= 0;
  const worked = useTypewriter(COPY.worked, reached("worked"), 55);
  const remaining = useCountUp(
    FIGURES.daysRemaining,
    reached("remaining"),
    2100 * factor,
  );
  const weeks = useCountUp(FIGURES.weeksPaid, scene === "weeks", 2600 * factor);
  const otherLine = useTypewriter(COPY.other, reached("other"), 52);
  // Más rápidos que el resto: son pies de imagen sobre el dibujo, no titulares.
  const planLine = useTypewriter(COPY.planCaption, scene === "plan", 40);
  const liftLine = useTypewriter(COPY.liftCaption, scene === "lift", 40);

  const eaten = useDrain(drainMs > 0, drainMs * factor);
  const showGlyph =
    scene === "payday" || scene === "drain" || scene === "cycle2" ||
    scene === "cycle3" || scene === "pension" || scene === "hold";
  const collapsed = scene === "zero" || scene === "pensionZero";

  const figureStep =
    reached("material") ? 4
    : scene === "costs" ? 3
    : scene === "comps" ? 2
    : scene === "listed" ? 0
    : -1;

  if (!armed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Secuencia de apertura"
      className="intro-root"
      data-act={act}
      data-rupture={scene === "rupture" ? "true" : "false"}
    >
      <div className="intro-vignette" aria-hidden="true" />
      <div className="intro-grain" aria-hidden="true" />

      <p className="intro-hud">
        sistema: <span className="intro-hud-on">cotizando</span>
        <span className="mx-2 opacity-40">·</span>
        semanas:{" "}
        <span className="intro-hud-on tabular-nums">
          {decimal.format(FIGURES.weeksRequired)}
        </span>
      </p>

      {/* ================= ACTO 1 · el Día 30 ================= */}
      {(scene === "worked" || scene === "remaining") && (
        <div className="intro-stack">
          <p className="intro-line">
            {worked.typed}
            {!worked.done && <span className="intro-caret" />}
          </p>
          {reached("remaining") && (
            <p className="intro-line intro-rise">
              {COPY.remaining}{" "}
              <span className="tabular-nums intro-accent">
                {decimal.format(remaining)}
              </span>
              .
            </p>
          )}
        </div>
      )}

      {/* El $ y su desfile de gastos — el objeto que rima en tres actos */}
      {(showGlyph || collapsed) && (
        <div className="payday">
          <p className="payday-label">
            {scene === "payday" ? COPY.payday : COPY.paydayShort}
          </p>
          <MoneyGlyph
            eaten={collapsed ? SLAB_COUNT : eaten}
            collapsed={collapsed}
            holding={scene === "hold"}
          />
          <ul className="expenses">
            {EXPENSES.map((e, i) => (
              <li
                key={e}
                data-on={
                  (scene === "hold" ? i < SLAB_COUNT : i < eaten) ? "true" : "false"
                }
              >
                {e}
              </li>
            ))}
          </ul>
          {scene === "hold" && (
            <ul className="gains">
              {Array.from({ length: mobile ? MOBILE_UNITS : DESKTOP_UNITS }).map(
                (_, i) => (
                  <li key={i} style={{ animationDelay: `${900 + i * 170}ms` }}>
                    +$
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      )}

      {/* ================= ACTO 2 · la pensión es lo mismo ================= */}
      {(scene === "weeks" || scene === "jump") && (
        <div className="intro-stack">
          <p className="intro-meta">
            {COPY.weeks}:{" "}
            <span className="tabular-nums intro-accent">
              {decimal.format(scene === "jump" ? FIGURES.weeksRequired : weeks)}
            </span>{" "}
            / {decimal.format(FIGURES.weeksRequired)}
          </p>
          <span className="gauge">
            <i data-full={scene === "jump" ? "true" : "false"} />
          </span>
          {scene === "jump" && <p className="intro-line intro-rise">{COPY.jump}</p>}
        </div>
      )}

      {scene === "pension" && <p className="pension-word">{COPY.pension}</p>}

      {scene === "verdict" && (
        <p className="intro-line intro-rise max-w-2xl">{COPY.verdict}</p>
      )}

      {/* ================= ACTOS 3 y 4 · el plano ================= */}
      {scene === "other" && (
        <p className="intro-line">
          {otherLine.typed}
          {!otherLine.done && <span className="intro-caret" />}
        </p>
      )}

      {reached("plan") && !reached("hold") && (
        <div className="sheet-stack">
          {(scene === "plan" || scene === "lift") && (
            <p className="sheet-caption">
              {scene === "plan" ? planLine.typed : liftLine.typed}
              {!(scene === "plan" ? planLine : liftLine).done && (
                <span className="intro-caret" />
              )}
            </p>
          )}

          <BlueprintScene
            stage={stageFor(scene, reached)}
            figureStep={figureStep}
            units={mobile ? MOBILE_UNITS : DESKTOP_UNITS}
            comparables={mobile ? MOBILE_COMPARABLES : COMPARABLES.length}
          />

          {reached("material") && !reached("repeat") && (
            <div className="gain-block intro-rise">
              <p className="gain-fig">+{price(FIGURES.gain)}</p>
              <p className="intro-meta">{COPY.gain}</p>
              <p className="thesis">{COPY.thesis}</p>
            </div>
          )}

          {scene === "repeat" && <p className="intro-line">{COPY.repeat}</p>}
          {reached("method") && !reached("hold") && (
            <>
              <p className="method-title">{COPY.method}</p>
              <MethodLine on={reached("method")} />
            </>
          )}
        </div>
      )}

      {/* El rótulo no es decorativo: cubre las cifras del caso Y las ocho
          ganancias de la rejilla, así que se queda en pantalla desde que
          aparece la primera hasta el final de la pieza. */}
      {reached("material") && <p className="disclaimer">{COPY.disclaimer}</p>}

      {/* ================= Reveal ================= */}
      {scene === "brand" && (
        <div className="intro-bloom flex flex-col items-center gap-6">
          <h2 className="brand-name">{COPY.brand}</h2>
          <p className="intro-meta">{COPY.tagline}</p>
          <Link href="/indice" onClick={dismiss} className="brand-cta">
            {COPY.cta}
          </Link>
        </div>
      )}

      {/* ================= Compuerta ================= */}
      {!running && (
        <button type="button" onClick={start} className="gate">
          <span className="gate-ring">
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
          <span className="gate-title">{COPY.gateTitle}</span>
          <span className="gate-hint">{COPY.gateHint}</span>
        </button>
      )}

      {running && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? COPY.unmute : COPY.mute}
          className="intro-sound"
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
            {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M16 9a4 4 0 0 1 0 6" />}
          </svg>
        </button>
      )}

      <button type="button" onClick={dismiss} className="intro-skip">
        {COPY.skip} ▸
      </button>

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
