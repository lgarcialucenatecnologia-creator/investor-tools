/** Reglas que el formulario comprueba antes de molestar al servidor. */

export const MIN_PASSWORD = 8;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Escribe tu correo.';
  // Deliberadamente laxa: la autoridad es el backend. Una expresión
  // estricta acá solo sirve para rechazar correos válidos poco comunes.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Revisa el correo, no parece válido.';
  }
  return null;
}

export function validateNewPassword(
  password: string,
  confirmation: string,
): string | null {
  if (password.length < MIN_PASSWORD) {
    return `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`;
  }
  if (password !== confirmation) return 'Las dos contraseñas no coinciden.';
  return null;
}
