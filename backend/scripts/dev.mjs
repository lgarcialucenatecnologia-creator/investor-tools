/**
 * Arranca el backend en modo desarrollo, vigilando también el `.env`.
 *
 * ¿Por qué hace falta un envoltorio? `nest start --watch` vigila `src` y
 * recompila solo, eso ya funciona. Pero `dotenv` lee el `.env` UNA vez, al
 * arrancar el proceso: cambiar una variable no tiene ningún efecto hasta que
 * el proceso muere y vuelve. Pasó dos veces en una tarde —cambiar la cadena
 * de modelos de Gemini y no ver el cambio— y las dos veces la conclusión de
 * la prueba fue equivocada por eso.
 *
 * Se intentó primero la vía de Nest: declarar el `.env` como «asset» con
 * `watchAssets`. No sirve para un archivo que vive fuera de `sourceRoot`:
 * falla con EISDIR al intentar copiarlo sobre el directorio `dist`.
 *
 * Así que el envoltorio hace lo único que de verdad resuelve el problema:
 * cuando cambia el `.env`, mata el proceso de Nest y lo levanta otra vez.
 */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILE = resolve(import.meta.dirname, '..', '.env');
/** Los editores escriben varias veces al guardar; se espera a que paren. */
const SETTLE_MS = 400;

let child = null;
let settling = null;
let shuttingDown = false;

function start() {
  child = spawn('npx', ['nest', 'start', '--watch'], {
    stdio: 'inherit',
    // Grupo propio: así una señal alcanza a Nest y a su compilador, no solo
    // al proceso de arriba, que dejaría huérfano al `tsc`.
    detached: true,
  });

  child.on('exit', (code) => {
    if (shuttingDown) return;
    if (code !== null && code !== 0) {
      console.error(`\n  Nest terminó con código ${code}. Esperando cambios…`);
    }
  });
}

function stopChild() {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    // Ya no estaba. No hay nada que hacer.
  }
  child = null;
}

function restart(reason) {
  console.log(`\n  ↻ ${reason} — reiniciando el backend…\n`);
  stopChild();
  // Un respiro para que el puerto quede libre antes de volver a escucharlo.
  setTimeout(start, 300);
}

watch(ENV_FILE, () => {
  clearTimeout(settling);
  settling = setTimeout(() => restart('cambió el .env'), SETTLE_MS);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shuttingDown = true;
    stopChild();
    process.exit(0);
  });
}

console.log('  Vigilando src (Nest) y .env (este envoltorio).\n');
start();
