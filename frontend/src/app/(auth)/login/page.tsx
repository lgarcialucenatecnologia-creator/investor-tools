import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Acceso' };

/**
 * Motivos por los que una sesión válida deja de servir. Llegan como
 * parámetro desde la guarda, para que quien fue expulsado sepa por qué en
 * vez de encontrarse un formulario en blanco.
 */
const REASONS: Record<string, string> = {
  ACCOUNT_SUSPENDED: 'Tu acceso está pausado. Escríbenos y lo revisamos contigo.',
  ACCESS_EXPIRED: 'Tu acceso llegó a su fecha de vencimiento. Escríbenos para renovarlo.',
  PASSWORD_NOT_SET: 'Tu cuenta todavía no tiene contraseña. Créala con «Soy usuario nuevo».',
  blocked: 'Tu sesión se cerró. Vuelve a entrar.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;

  // El destino se valida acá y no en el cliente: uno externo convertiría el
  // acceso en un trampolín hacia otro sitio.
  const target =
    next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  return (
    <div className="w-full max-w-[26rem]">
      {reason && REASONS[reason] && (
        <p
          role="status"
          className="mb-6 rounded-md border border-dorado/40 bg-dorado/10 px-3 py-2 text-sm text-marfil"
        >
          {REASONS[reason]}
        </p>
      )}
      <LoginForm next={target} />
    </div>
  );
}
