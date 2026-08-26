const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat('es-CO');

export const money = (value: number) => pesos.format(value);
export const number = (value: number) => plain.format(value);
export const percent = (rate: number) =>
  `${plain.format(Math.round(rate * 1000) / 10)}%`;

export const shortDate = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
