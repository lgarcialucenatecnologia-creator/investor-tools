function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} debe ser un entero positivo. Recibido: "${raw}"`);
  }
  return value;
}

/**
 * Todo lo que lee `process.env` vive DENTRO de la fábrica: en el nivel del
 * módulo se ejecutaría antes de que ConfigModule cargue el archivo .env, y
 * fallaría siempre por variables ausentes que en realidad sí están.
 */
export const configuration = () => {
  const accessSecret = required('JWT_ACCESS_SECRET');
  const refreshSecret = required('JWT_REFRESH_SECRET');

  /**
   * Los dos tokens llevan exactamente el mismo contenido. Lo ÚNICO que impide
   * usar un refresh de 7 días como token de acceso es que los secretos sean
   * distintos, así que un copy-paste en el .env de producción borraría esa
   * separación sin romper nada visible. Se comprueba al arrancar.
   */
  if (accessSecret === refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET y JWT_REFRESH_SECRET no pueden ser iguales: ' +
        'un refresh de 7 días valdría como token de acceso. ' +
        'Genera cada uno con: openssl rand -base64 48',
    );
  }

  return {
    port: positiveInt('PORT', 4000),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    /**
     * Cuántos saltos de proxy hay delante del API. Sin esto, el contador de
     * intentos usa la IP del proxy y todos los usuarios comparten un mismo
     * cupo. En local es 0; en Vercel, Railway o detrás de Nginx suele ser 1.
     */
    trustProxyHops: positiveInt('TRUST_PROXY_HOPS', 0),
    mongodb: {
      uri: required('MONGODB_URI'),
    },
    jwt: {
      accessSecret,
      accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
      refreshSecret,
      refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    },
    session: {
      /** Sesiones simultáneas por usuario. Computador y celular a la vez. */
      maxPerUser: positiveInt('SESSION_MAX_PER_USER', 5),
      /**
       * Margen durante el cual el refresh recién rotado sigue siendo válido.
       * Sin él, dos pestañas refrescando en paralelo se leen como robo de
       * token y cierran la sesión del usuario legítimo.
       */
      rotationGraceMs: positiveInt('SESSION_ROTATION_GRACE_MS', 30_000),
    },
    /**
     * El acceso a la plataforma lo da el asesor tras la compra, no un
     * formulario público. Apagado salvo que se encienda a propósito.
     */
    /**
     * Administrador definido por entorno, para `npm run seed:admin`.
     *
     * ⚠️ La contraseña queda en el archivo .env y en los registros del
     * despliegue. Quien tenga acceso al entorno tiene administrador
     * permanente. Cómodo en desarrollo; en producción conviene cambiarla
     * desde la aplicación después del primer ingreso.
     *
     * Solo lo lee el comando de siembra: NADA en el arranque del servidor
     * depende de esto, para que borrar la cuenta no la resucite en el
     * siguiente despliegue.
     */
    admin: {
      email: process.env.ADMIN_EMAIL ?? null,
      password: process.env.ADMIN_PASSWORD ?? null,
      fullName: process.env.ADMIN_FULL_NAME ?? null,
    },
    activation: {
      /** Plazo para crear la contraseña desde que el asesor da el alta. */
      ttlHours: positiveInt('ACTIVATION_TTL_HOURS', 72),
    },
    selfRegistrationEnabled: process.env.SELF_REGISTRATION_ENABLED === 'true',
  };
};
