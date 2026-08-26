import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-6xl text-dorado">404</p>
      <h1 className="font-display text-2xl text-marfil">
        Esta página no existe
      </h1>
      <p className="max-w-sm text-marfil/70">
        Puede que el enlace esté viejo o que la herramienta todavía no esté
        habilitada.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-md bg-dorado px-6 py-3 font-medium text-obsidiana transition-colors hover:bg-oro"
      >
        Ir a mi panel
      </Link>
    </div>
  );
}
