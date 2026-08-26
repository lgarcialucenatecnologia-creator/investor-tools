'use client';

import { useEffect } from 'react';

/**
 * No culpa a quien está usando la app ni le muestra el detalle técnico: no
 * puede hacer nada con él, y en una plataforma sobre su patrimonio un
 * volcado de error asusta más de lo que informa.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-2xl text-marfil">
        Algo se interrumpió
      </h1>
      <p className="max-w-sm text-marfil/70">
        No pudimos cargar esta parte. Vuelve a intentarlo; si sigue pasando,
        escríbenos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-dorado px-6 py-3 font-medium text-obsidiana transition-colors hover:bg-oro"
      >
        Reintentar
      </button>
      {error.digest && (
        <p className="text-xs text-grafito-texto">Referencia: {error.digest}</p>
      )}
    </div>
  );
}
