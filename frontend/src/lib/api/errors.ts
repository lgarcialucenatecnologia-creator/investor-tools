/**
 * Error del API con el código que el backend envía junto al mensaje.
 *
 * El mensaje es para la persona y el código para el programa: la pantalla de
 * acceso decide qué modo mostrar según el código, así que cambiar la
 * redacción de un mensaje nunca debe alterar el comportamiento.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Códigos que el frontend distingue. Deben coincidir con el backend. */
export const ErrorCode = {
  PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCESS_EXPIRED: 'ACCESS_EXPIRED',
  ACTIVATION_EXPIRED: 'ACTIVATION_EXPIRED',
} as const;

const FALLBACK = 'No pudimos completar la operación. Inténtalo de nuevo.';

/** Saca mensaje y código de una respuesta de error de NestJS. */
export function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object') {
    const shape = body as { message?: unknown; code?: unknown };
    const message = Array.isArray(shape.message)
      ? String(shape.message[0])
      : typeof shape.message === 'string'
        ? shape.message
        : FALLBACK;
    const code = typeof shape.code === 'string' ? shape.code : undefined;
    return new ApiError(status, message, code);
  }
  return new ApiError(status, FALLBACK);
}
