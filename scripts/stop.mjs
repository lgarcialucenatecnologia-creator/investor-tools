/**
 * Apaga SOLO los servidores de este proyecto.
 *
 * Existe porque un `pkill -f "next dev"` mata también el de cualquier otro
 * proyecto abierto en la máquina — y en esta ya convivió con el de smartbeemo
 * en los puertos 3000 y 4000. Aquí se comprueba el directorio de trabajo de
 * cada proceso antes de tocarlo: si no vive en esta carpeta, no se toca.
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** El directorio de trabajo de un proceso, según lsof. */
function cwdOf(pid) {
  try {
    return execSync(`lsof -a -p ${pid} -d cwd -Fn 2>/dev/null`, {
      encoding: 'utf8',
    })
      .split('\n')
      .find((line) => line.startsWith('n'))
      ?.slice(1);
  } catch {
    return undefined;
  }
}

const patterns = ['next dev', 'nest start', 'scripts/dev.mjs'];
const seen = new Set();
let killed = 0;
let spared = 0;

for (const pattern of patterns) {
  let pids = [];
  try {
    pids = execSync(`pgrep -f ${JSON.stringify(pattern)} 2>/dev/null`, {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    continue; // pgrep sale con código 1 cuando no encuentra nada.
  }

  for (const pid of pids) {
    if (seen.has(pid)) continue;
    seen.add(pid);

    const cwd = cwdOf(pid);
    if (!cwd?.startsWith(ROOT)) {
      if (cwd) {
        console.log(`  · ${pid} es de otro proyecto, no se toca`);
        spared += 1;
      }
      continue;
    }

    try {
      process.kill(Number(pid), 'SIGTERM');
      console.log(`  ✓ ${pid} (${pattern}) detenido`);
      killed += 1;
    } catch {
      // Ya se había ido por su cuenta.
    }
  }
}

if (killed === 0 && spared === 0) {
  console.log('  No había nada corriendo de este proyecto.');
}
