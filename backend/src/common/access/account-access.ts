import { ForbiddenException } from '@nestjs/common';
import { UserStatus } from '../../modules/users/schemas/user.schema';

/** Lo mínimo que hace falta para juzgar si una cuenta puede entrar. */
export interface AccountState {
  status: UserStatus;
  accessExpiresAt: Date | null;
}

/**
 * Única fuente de verdad sobre si una cuenta puede usar la plataforma.
 *
 * Lanza 403 y nunca 401. La diferencia importa: el cliente borra la sesión
 * ante un 401 y manda al login, donde el usuario entra bien y vuelve a
 * chocar — un bucle. Un 403 dice «tu sesión es válida, tu cuenta no».
 *
 * Se llama SIEMPRE después de comprobar la contraseña. Al revés le
 * confirmaría a un desconocido que ese correo existe y está vencido,
 * deshaciendo el trabajo del hash de descarte.
 */
export function assertAccountUsable(account: AccountState): void {
  if (account.status === UserStatus.SUSPENDED) {
    throw new ForbiddenException(
      'Tu acceso está pausado. Escríbenos y lo revisamos contigo.',
    );
  }

  if (account.status === UserStatus.PENDING_ACTIVATION) {
    throw new ForbiddenException(
      'Tu cuenta todavía no tiene contraseña. Entra por «Soy usuario nuevo» para crearla.',
    );
  }

  if (
    account.accessExpiresAt &&
    account.accessExpiresAt.getTime() < Date.now()
  ) {
    throw new ForbiddenException(
      'Tu acceso llegó a su fecha de vencimiento. Escríbenos para renovarlo.',
    );
  }
}
