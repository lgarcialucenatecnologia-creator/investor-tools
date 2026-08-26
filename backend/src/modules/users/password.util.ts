import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

export const SALT_ROUNDS = 12;

/**
 * Hash bcrypt de un secreto aleatorio que nadie conoce ni puede recuperar.
 *
 * Sirve para dos cosas a la vez:
 *
 * 1. Comparar contra él cuando el correo no existe, para que el login tarde
 *    lo mismo exista o no la cuenta y no se pueda enumerar usuarios midiendo
 *    el tiempo de respuesta.
 * 2. Ser la contraseña de una cuenta recién dada de alta. Guardar cadena
 *    vacía —como hace el proyecto de referencia— hace que bcrypt salga por
 *    un camino más corto y esa cuenta responda más rápido que las demás.
 *
 * Se calcula una sola vez al cargar el módulo: bcrypt con coste 12 tarda
 * ~250 ms y no puede pagarse en cada petición.
 */
export const UNUSABLE_PASSWORD_HASH = bcrypt.hashSync(
  randomBytes(32).toString('hex'),
  SALT_ROUNDS,
);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  hash: string | undefined,
): Promise<boolean> {
  return bcrypt.compare(plain, hash ?? UNUSABLE_PASSWORD_HASH);
}
