/**
 * Monograma de la marca: una «P» en serif sobre el dorado. Es la única pieza
 * dorada permanente del panel, así que el resto del dorado sigue reservado a
 * lo que tiene valor en cada pantalla.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="surface-gold grid size-9 shrink-0 place-items-center rounded-xl font-display text-lg leading-none"
      >
        P
      </span>
      {!compact && (
        <span className="font-display text-[0.95rem] leading-tight tracking-tight text-marfil">
          Pensionate con
          <br />
          <span className="text-marfil/70">Bienes Raíces</span>
        </span>
      )}
    </span>
  );
}

/** Iniciales para el avatar: «Luis Fernando García» → «LG». */
export function initialsOf(fullName: string, email: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return email.slice(0, 2).toUpperCase();
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}
