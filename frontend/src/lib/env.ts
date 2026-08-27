import "server-only";

/**
 * Prefijo bajo el que el backend monta todas sus rutas.
 *
 * Debe coincidir con `app.setGlobalPrefix('api')` de main.ts. Vive aquí, en
 * el código, y no en la variable de entorno: es una propiedad del backend, no
 * una decisión de quien despliega. Olvidarlo al configurar el servidor
 * producía un 404 que solo se veía en el primer intento de acceso.
 */
const API_PREFIX = "/api";

/**
 * Entorno del servidor de Next.
 *
 * `API_URL` no lleva el prefijo `NEXT_PUBLIC_`, y no es un descuido: con el
 * patrón que usa esta app el navegador nunca llama a NestJS directamente,
 * sino a las rutas del propio Next. Exponer la dirección del API al cliente
 * solo serviría para que alguien la llamara saltándose las cookies.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Cópiala de .env.example.`,
    );
  }
  return value;
}

/**
 * Deja  la dirección del API siempre terminada en el prefijo, venga como
 * venga. Acepta tanto `https://api.ejemplo.com` como
 * `https://api.ejemplo.com/api` para no romper las configuraciones que ya
 * existen ni obligar a cambiarlas todas a la vez.
 */
export function normalizeApiUrl(raw: string): string {
  const base = raw.trim().replace(/\/+$/, "");
  const withoutPrefix = base.endsWith(API_PREFIX)
    ? base.slice(0, -API_PREFIX.length)
    : base;
  return `${withoutPrefix}${API_PREFIX}`;
}

export const env = {
  apiUrl: normalizeApiUrl(required("API_URL")),
  isProduction: process.env.NODE_ENV === "production",
};
