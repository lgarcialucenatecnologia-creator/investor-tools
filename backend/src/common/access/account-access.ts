import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { UserStatus } from '../../modules/users/schemas/user.schema';
import { ErrorCode, type ErrorCodeValue } from '../errors/error-codes';

/** Lo mínimo que hace falta para juzgar si una cuenta puede entrar. */
export interface AccountState {
  status: UserStatus;
  accessExpiresAt: Date | null;
  activationExpiresAt?: Date | null;
}

function fail(
  status: HttpStatus,
  code: ErrorCodeValue,
  message: string,
): never {
  throw new HttpException({ statusCode: status, code, message }, status);
}

/**
 * Única fuente de verdad sobre si una cuenta puede usar la plataforma.
 *
 * Nunca lanza 401. La diferencia importa: el cliente borra la sesión ante un
 * 401 y manda al login, donde el usuario entra bien y vuelve a chocar — un
 * bucle. Un 403 dice «tu sesión es válida, tu cuenta no».
 *
 * Se llama SIEMPRE después de comprobar la contraseña. Al revés le
 * confirmaría a un desconocido que ese correo existe y está vencido,
 * deshaciendo el trabajo del hash de descarte.
 */
export function assertAccountUsable(account: AccountState): void {
  assertNotPending(account);

  if (account.status === UserStatus.SUSPENDED) {
    fail(
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCOUNT_SUSPENDED,
      'Tu acceso está pausado. Escríbenos y lo revisamos contigo.',
    );
  }

  if (
    account.accessExpiresAt &&
    account.accessExpiresAt.getTime() < Date.now()
  ) {
    fail(
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCESS_EXPIRED,
      'Tu acceso llegó a su fecha de vencimiento. Escríbenos para renovarlo.',
    );
  }
}

/**
 * Cuenta dada de alta que aún no tiene contraseña.
 *
 * Esta comprobación va ANTES de comparar la contraseña, al contrario que las
 * otras dos, y es una decisión deliberada:
 *
 * - Una cuenta pendiente no tiene contraseña válida, así que jamás pasaría la
 *   comparación. Sin esto, quien olvide que es usuario nuevo se queda
 *   golpeándose contra «correo o contraseña incorrectos» sin salida.
 * - No filtra nada que no se sepa ya: la pantalla «Soy usuario nuevo»
 *   responde exactamente lo mismo para ese correo.
 *
 * Suspensión y vencimiento se quedan DESPUÉS de la contraseña, porque esos sí
 * hablan de clientes activos y solo debe conocerlos quien tenga la clave.
 */
export function assertNotPending(account: AccountState): void {
  if (account.status === UserStatus.PENDING_ACTIVATION) {
    // 428 y no 403: no es una negativa, es un paso que falta.
    fail(
      HttpStatus.PRECONDITION_REQUIRED,
      ErrorCode.PASSWORD_NOT_SET,
      'Tu cuenta todavía no tiene contraseña. Créala para entrar por primera vez.',
    );
  }
}

/**
 * El plazo para crear la contraseña. Acota la ventana en la que una cuenta
 * recién dada de alta puede ser reclamada por quien conozca el correo: si
 * nadie la activa a tiempo, el administrador tiene que volver a habilitarla.
 */
export function assertActivationOpen(account: AccountState): void {
  if (
    account.activationExpiresAt &&
    account.activationExpiresAt.getTime() < Date.now()
  ) {
    throw new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      code: ErrorCode.ACTIVATION_EXPIRED,
      message:
        'El plazo para crear tu contraseña se venció. Escríbenos y lo habilitamos de nuevo.',
    });
  }
}
