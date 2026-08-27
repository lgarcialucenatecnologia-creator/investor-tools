/**
 * Se ve mientras el panel resuelve quién eres.
 *
 * Sin altura de pantalla: esto se pinta DENTRO del contenido, que ya está
 * dimensionado por el contenedor. Un `min-h-screen` aquí añadiría una barra
 * de desplazamiento que no hace falta.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span className="text-sm tracking-[0.14em] text-grafito-texto">
        Cargando…
      </span>
    </div>
  );
}
