/** Se ve mientras el layout le pregunta al backend quién eres. */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-sm tracking-[0.14em] text-grafito-texto">
        Cargando…
      </span>
    </div>
  );
}
