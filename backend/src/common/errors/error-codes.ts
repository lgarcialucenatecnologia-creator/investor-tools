/**
 * Códigos que el frontend necesita distinguir para decidir qué pantalla
 * mostrar. El mensaje es para la persona; el código, para el programa —
 * cambiar la redacción no debe romper el comportamiento del cliente.
 */
export const ErrorCode = {
  /** La cuenta existe pero todavía no tiene contraseña. */
  PASSWORD_NOT_SET: 'PASSWORD_NOT_SET',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCESS_EXPIRED: 'ACCESS_EXPIRED',
  /** El plazo para crear la contraseña se venció. */
  ACTIVATION_EXPIRED: 'ACTIVATION_EXPIRED',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
