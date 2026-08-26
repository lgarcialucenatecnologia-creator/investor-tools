/**
 * Sonido de la Secuencia de Apertura, sintetizado en el navegador.
 *
 * No hay archivos: cada señal se genera con osciladores y ruido, así que no
 * pesa nada, no depende de un CDN (que la CSP bloquearía) y no hay que esperar
 * a que cargue antes de arrancar la narración.
 *
 * El AudioContext se crea dentro del clic de la compuerta. Esa es la única
 * razón real por la que la compuerta existe: los navegadores no dejan sonar
 * nada sin un gesto previo del usuario.
 */

export type Cue = "tick" | "fracture" | "draw" | "unit" | "chime";

export type IntroAudio = {
  cue: (c: Cue) => void;
  /** Colchón grave sostenido: la tensión mientras la cifra está en pantalla. */
  pad: (on: boolean) => void;
  setMuted: (muted: boolean) => void;
  close: () => void;
};

/**
 * Volumen general. Subirlo a secas arriesga saturación cuando dos señales se
 * solapan (el colchón sigue sonando cuando entra el quiebre), así que el
 * máster pasa por un compresor que hace de red antes de la salida.
 */
const MASTER = 1.0;
/**
 * Ganancia después del limitador. Subir el máster por sí solo ya no da más
 * volumen (el limitador aplana), así que el empujón final se da acá, donde
 * los picos ya vienen controlados.
 */
const MAKEUP = 1.7;

export function createIntroAudio(): IntroAudio | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();

  // Limitador suave: por encima de -10 dB comprime 6:1. No se nota en las
  // señales sueltas y evita que el quiebre distorsione sobre el colchón.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 6;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.18;
  const makeup = ctx.createGain();
  makeup.gain.value = MAKEUP;
  limiter.connect(makeup).connect(ctx.destination);

  const master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(limiter);

  // Un solo búfer de ruido reutilizado por el tic, el quiebre y el trazo.
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  function burst(
    filter: BiquadFilterType,
    freq: number,
    q: number,
    gain: number,
    decay: number,
  ) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = filter;
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + decay);
  }

  function tone(
    freq: number,
    gain: number,
    attack: number,
    release: number,
    type: OscillatorType = "sine",
    endFreq?: number,
  ) {
    const osc = ctx.createOscillator();
    osc.type = type;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + release);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + attack + release + 0.05);
  }

  /**
   * Un reloj no hace "tic tic tic": alterna. El *tic* es más brillante y
   * fuerte, el *tac* más apagado y grave — es el escape del mecanismo yendo y
   * volviendo. Cada golpe son dos capas: el transitorio metálico y el cuerpo
   * de madera de la caja.
   */
  let tickPhase = 0;
  function clockTick() {
    const tock = tickPhase++ % 2 === 1;
    burst("bandpass", tock ? 2100 : 2950, 12, tock ? 0.15 : 0.19, 0.026);
    burst("bandpass", tock ? 540 : 780, 6, tock ? 0.11 : 0.14, 0.06);
  }

  // --- Colchón grave, encendido y apagado con rampa larga ---
  let padGain: GainNode | null = null;
  function pad(on: boolean) {
    const t = ctx.currentTime;
    if (on) {
      if (padGain) return;
      padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0.0001, t);
      padGain.gain.exponentialRampToValueAtTime(0.12, t + 1.6);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 260;
      padGain.connect(lp).connect(master);
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = 55;
        osc.detune.value = detune;
        osc.connect(padGain);
        osc.start(t);
      }
      return;
    }
    if (!padGain) return;
    const dying = padGain;
    padGain = null;
    dying.gain.cancelScheduledValues(t);
    dying.gain.setValueAtTime(dying.gain.value, t);
    dying.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  }

  function cue(c: Cue) {
    switch (c) {
      case "tick": // el escape del reloj, alternando tic y tac
        clockTick();
        break;
      case "fracture": // algo que deja de sostenerse
        tone(110, 0.38, 0.005, 0.85, "sine", 38);
        burst("lowpass", 700, 1, 0.28, 0.5);
        break;
      case "draw": // el roce de la pluma sobre el papel
        burst("highpass", 3200, 0.7, 0.08, 0.45);
        break;
      case "unit": // cada unidad que aterriza en la rejilla
        tone(660, 0.11, 0.008, 0.18);
        break;
      case "chime":
        // Resolución: Do mayor con novena, desplegado de grave a agudo sobre
        // un sub que lo sostiene, y una campana encima con cola larga. El
        // acorde no se corta — se deja ir, que es lo que suena a alivio.
        tone(65.4, 0.18, 0.55, 3.4, "sine");
        [130.8, 196.0, 261.6, 329.6, 392.0, 587.3].forEach((f, i) => {
          window.setTimeout(() => tone(f, 0.10, 0.14, 3.1), i * 105);
        });
        window.setTimeout(() => {
          tone(1046.5, 0.055, 0.012, 3.6);
          tone(1568.0, 0.032, 0.012, 2.9);
        }, 720);
        break;
    }
  }

  return {
    cue,
    pad,
    setMuted: (muted) => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(muted ? 0.0001 : MASTER, t + 0.18);
    },
    close: () => {
      pad(false);
      window.setTimeout(() => void ctx.close(), 1000);
    },
  };
}
