import 'server-only';

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

export const env = {
  apiUrl: required('API_URL').replace(/\/$/, ''),
  isProduction: process.env.NODE_ENV === 'production',
};
