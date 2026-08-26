import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Acceso' };

/**
 * `next` viene de la guarda de rutas cuando alguien intentó entrar a una
 * página protegida. Se valida acá y no en el cliente: un destino externo
 * convertiría el acceso en un trampolín hacia otro sitio.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target =
    next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  return <LoginForm next={target} />;
}
