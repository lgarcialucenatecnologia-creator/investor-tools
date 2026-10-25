import type { ReactNode } from 'react';

/**
 * Anillo de avance. El número del centro lo escribe quien lo usa: el anillo
 * solo dibuja la proporción, y lleva su propia etiqueta accesible porque un
 * arco no se puede leer en voz alta.
 */
export function ProgressRing({
  value,
  size = 112,
  stroke = 9,
  tone = 'dorado',
  label,
  children,
}: {
  /** 0–100. */
  value: number;
  size?: number;
  stroke?: number;
  /** `obsidiana` para dibujarlo sobre la superficie dorada. */
  tone?: 'dorado' | 'obsidiana' | 'marfil';
  label: string;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const colors = {
    dorado: { track: 'stroke-marfil/10', bar: 'stroke-dorado' },
    obsidiana: { track: 'stroke-obsidiana/15', bar: 'stroke-obsidiana' },
    marfil: { track: 'stroke-marfil/15', bar: 'stroke-marfil' },
  }[tone];

  return (
    <div
      role="img"
      aria-label={label}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={colors.track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={`${colors.bar} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
