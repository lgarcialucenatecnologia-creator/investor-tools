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
 *
 * Los Actos 1 y 2 suenan a oficina: reloj, teclado, clicks secos. Los Actos 3
 * y 4 suenan a precisión: lápiz técnico, encajes, calculadora. Nada de música
 * épica — el tono del método es ordenado, no emocionante.
 */

export type Cue =
  | "tick"
  | "key"
  | "click"
  | "fracture"
  | "collapse"
  | "glitch"
  | "draw"
  | "snap"
  | "calc"
  | "hold"
  | "unit"
  | "chime";

export type IntroAudio = {
  cue: (c: Cue) => void;
  /** Colchón grave sostenido: la tensión mientras la cifra está en pantalla. */
  pad: (on: boolean) => void;
  /** Rumor de oficina de fondo — solo en los Actos 1 y 2. */
  ambience: (on: boolean) => void;
  /** Corta absolutamente todo. La ruptura del segundo 22. */
  silence: (on: boolean) => void;
  setMuted: (muted: boolean) => void;
  close: () => void;
};

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

  // Dos compuertas encadenadas: `silencer` es la ruptura, `master` es el
  // botón de silencio del usuario. Separadas para que una no pise a la otra.
  const silencer = ctx.createGain();
  silencer.gain.value = 1;
  silencer.connect(limiter);

  const master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(silencer);

  // Un solo búfer de ruido reutilizado por todo lo percusivo.
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

  // --- Capas sostenidas: colchón grave y rumor de oficina ---
  function sustained(
    build: (dest: GainNode) => void,
    target: number,
    riseS: number,
    fallS: number,
  ) {
    let node: GainNode | null = null;
    return (on: boolean) => {
      const t = ctx.currentTime;
      if (on) {
        if (node) return;
        node = ctx.createGain();
        node.gain.setValueAtTime(0.0001, t);
        node.gain.exponentialRampToValueAtTime(target, t + riseS);
        build(node);
        return;
      }
      if (!node) return;
      const dying = node;
      node = null;
      dying.gain.cancelScheduledValues(t);
      dying.gain.setValueAtTime(Math.max(dying.gain.value, 0.0001), t);
      dying.gain.exponentialRampToValueAtTime(0.0001, t + fallS);
    };
  }

  const pad = sustained(
    (dest) => {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 260;
      dest.connect(lp).connect(master);
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = 55;
        osc.detune.value = detune;
        osc.connect(dest);
        osc.start(ctx.currentTime);
      }
    },
    0.12,
    1.6,
    0.9,
  );

  const ambience = sustained(
    (dest) => {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      dest.connect(lp).connect(master);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      src.connect(dest);
      src.start(ctx.currentTime);
      // Zumbido de fluorescente, apenas perceptible pero es lo que da oficina.
      const hum = ctx.createOscillator();
      hum.type = "sine";
      hum.frequency.value = 120;
      const hg = ctx.createGain();
      hg.gain.value = 0.16;
      hum.connect(hg).connect(dest);
      hum.start(ctx.currentTime);
    },
    0.05,
    2.0,
    0.6,
  );

  function cue(c: Cue) {
    switch (c) {
      case "tick": // el escape del reloj, alternando tic y tac
        clockTick();
        break;
      case "key": // tecla de máquina de escribir
        burst("bandpass", 1900, 5, 0.09, 0.022);
        burst("lowpass", 420, 1, 0.05, 0.04);
        break;
      case "click": // cada gasto que llega: seco, sin cuerpo, sin apelación
        burst("highpass", 4200, 1, 0.16, 0.016);
        burst("bandpass", 1100, 9, 0.13, 0.03);
        break;
      case "fracture": // algo que deja de sostenerse
        tone(110, 0.38, 0.005, 0.85, "sine", 38);
        burst("lowpass", 700, 1, 0.28, 0.5);
        break;
      case "collapse": // el $ tocando el cero
        tone(150, 0.30, 0.004, 0.9, "sine", 42);
        burst("lowpass", 380, 1, 0.24, 0.7);
        break;
      case "glitch": // la ruptura: corto y sucio, y después nada
        burst("bandpass", 1600, 0.6, 0.34, 0.12);
        burst("highpass", 6000, 0.5, 0.22, 0.09);
        tone(300, 0.22, 0.002, 0.11, "square", 90);
        break;
      case "draw": // el roce del lápiz técnico sobre el papel
        burst("highpass", 3200, 0.7, 0.08, 0.45);
        break;
      case "snap": // una cota que encaja en su sitio
        burst("bandpass", 3400, 14, 0.13, 0.03);
        tone(880, 0.06, 0.004, 0.09, "triangle");
        break;
      case "calc": // dígito de calculadora
        tone(1320, 0.055, 0.003, 0.06, "square");
        break;
      case "hold": // el $ que esta vez aguanta: grave, firme, sin caída
        tone(98, 0.26, 0.02, 0.7, "sine");
        tone(196, 0.10, 0.02, 0.55, "triangle");
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
    ambience,
    silence: (on) => {
      const t = ctx.currentTime;
      silencer.gain.cancelScheduledValues(t);
      silencer.gain.setValueAtTime(silencer.gain.value, t);
      // Al entrar, de golpe: el corte seco es el efecto. Al salir, con rampa.
      silencer.gain.linearRampToValueAtTime(on ? 0 : 1, t + (on ? 0.02 : 0.25));
    },
    setMuted: (muted) => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(muted ? 0.0001 : MASTER, t + 0.18);
    },
    close: () => {
      pad(false);
      ambience(false);
      window.setTimeout(() => void ctx.close(), 1000);
    },
  };
}
