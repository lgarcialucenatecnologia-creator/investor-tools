import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OpeningSequence } from '@/components/intro/opening-sequence';
import { getSession } from '@/lib/session/server';

/**
 * La portada no es una landing: es la puerta.
 *
 * La primera visita ve la Secuencia de Apertura entera. Quien ya la vio, o
 * la salta, se encuentra esta pantalla, cuya única salida es entrar. Y quien
 * ya tiene sesión ni siquiera pasa por aquí.
 */
export default async function Home() {
  if (await getSession()) redirect('/dashboard');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <OpeningSequence />

      <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
        Planificación patrimonial inmobiliaria
      </p>

      <h1 className="font-display text-4xl leading-tight text-oro md:text-5xl">
        Pensionate joven con Bienes Raíces
      </h1>

      <p className="max-w-md leading-relaxed text-marfil/70">
        La ganancia empieza en la compra.
      </p>

      <Link
        href="/login"
        className="mt-2 rounded-md bg-dorado px-8 py-4 font-medium text-obsidiana transition-colors hover:bg-oro"
      >
        Entrar
      </Link>

      <p className="text-sm text-grafito-texto">
        Tu acceso lo habilita tu asesor después de la compra.
      </p>
    </div>
  );
}
