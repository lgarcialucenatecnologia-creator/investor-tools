/**
 * Lectura del archivo de altas masivas.
 *
 * Se analiza en el navegador y se envía como datos, no como archivo: así el
 * backend valida cada fila con las mismas reglas que el alta de una sola, y
 * el asesor ve los problemas antes de enviar nada.
 */
export interface CsvRow {
  fullName: string;
  email: string;
  phone?: string;
}

export interface CsvParseResult {
  rows: CsvRow[];
  problems: { line: number; reason: string }[];
}

const HEADERS = {
  fullName: ['nombre', 'nombre completo', 'fullname', 'name'],
  email: ['correo', 'email', 'correo electronico', 'correo electrónico'],
  phone: ['telefono', 'teléfono', 'celular', 'phone'],
};

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/^"|"$/g, '');

/** Separa una línea respetando las comillas: hay nombres con coma. */
function splitLine(line: string, separator: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === separator && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseCsvUsers(text: string): CsvParseResult {
  const lines = text
    .replace(/^﻿/, '') // Excel guarda una marca invisible al inicio
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], problems: [{ line: 0, reason: 'El archivo está vacío.' }] };
  }

  // Excel en español guarda con punto y coma; el resto del mundo con coma.
  const separator = (lines[0].match(/;/g) ?? []).length >
    (lines[0].match(/,/g) ?? []).length
    ? ';'
    : ',';

  const header = splitLine(lines[0], separator).map(normalize);
  const index = {
    fullName: header.findIndex((h) => HEADERS.fullName.includes(h)),
    email: header.findIndex((h) => HEADERS.email.includes(h)),
    phone: header.findIndex((h) => HEADERS.phone.includes(h)),
  };

  if (index.fullName === -1 || index.email === -1) {
    return {
      rows: [],
      problems: [
        {
          line: 1,
          reason:
            'La primera fila debe tener las columnas «nombre» y «correo».',
        },
      ],
    };
  }

  const rows: CsvRow[] = [];
  const problems: { line: number; reason: string }[] = [];
  const seen = new Set<string>();

  lines.slice(1).forEach((line, i) => {
    const number = i + 2;
    const cells = splitLine(line, separator);
    const fullName = cells[index.fullName]?.replace(/^"|"$/g, '').trim() ?? '';
    const email = (cells[index.email] ?? '').replace(/^"|"$/g, '').trim().toLowerCase();
    const phone =
      index.phone >= 0
        ? (cells[index.phone] ?? '').replace(/^"|"$/g, '').trim()
        : '';

    if (!fullName || fullName.length < 3) {
      problems.push({ line: number, reason: 'Falta el nombre.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      problems.push({ line: number, reason: `Correo inválido: ${email || '(vacío)'}` });
      return;
    }
    // Repetidos dentro del propio archivo: el backend rechazaría el segundo,
    // pero es mejor avisarlo antes de enviar nada.
    if (seen.has(email)) {
      problems.push({ line: number, reason: `Repetido en el archivo: ${email}` });
      return;
    }

    seen.add(email);
    rows.push({ fullName, email, ...(phone ? { phone } : {}) });
  });

  return { rows, problems };
}
