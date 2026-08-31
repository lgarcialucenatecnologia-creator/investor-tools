import { GoogleGenAI } from '@google/genai';
import { withFallback, withRetry } from '../../common/resilience/retry';

/**
 * Convierte el PDF del método en Markdown limpio.
 *
 * Se usa Gemini como extractor y no una librería de PDF por una razón
 * concreta: el documento está DISEÑADO —columnas, tablas, cajas, encabezados
 * repetidos— y `pdf-parse` sobre eso devuelve el encabezado 130 veces, las
 * columnas entrelazadas y las tablas convertidas en papilla. Además esto
 * funciona igual si el PDF viniera escaneado, sin capa de texto.
 *
 * Es una llamada única, al subir. No se repite en cada pregunta.
 */

/**
 * SE EXTRAE POR TANDAS, y no de una sola vez, porque el límite de SALIDA del
 * modelo es mucho menor que el de entrada. 130 páginas son unas 45.000
 * palabras: no caben en una respuesta por muy grande que sea la ventana de
 * contexto. Pedirlo entero devuelve un texto truncado a la mitad, y lo peor
 * es que se trunca en silencio.
 */
/**
 * 20 y no 12: cada tanda es una llamada, y cada llamada una oportunidad de
 * fallar por saturación del modelo. Menos tandas es menos riesgo. 20 páginas
 * de este documento son unas 7.000 palabras, muy por debajo del límite de
 * salida — el margen sigue siendo amplio.
 */
const PAGES_PER_BATCH = 20;

const PROMPT = `Transcribe a Markdown las páginas {RANGE} de este documento.

Reglas:
- Fidelidad absoluta. No resumas, no completes, no corrijas, no interpretes.
- Respeta la jerarquía: los títulos numerados van como ## y los subtítulos como ###.
- Las tablas van como tablas de Markdown.
- Las listas con viñeta van con -.
- NO repitas encabezados ni pies de página que se repiten en cada hoja.
- Si una frase queda cortada al final del rango, transcríbela hasta donde llegue.
- Devuelve SOLO el Markdown. Sin preámbulo, sin explicación, sin cercas de código.`;

/**
 * Cuenta las páginas leyendo el propio PDF.
 *
 * Se cuentan los objetos `/Type /Page` excluyendo `/Type /Pages`, que es el
 * nodo contenedor. Es una lectura cruda pero suficiente: el resultado se le
 * muestra a quien sube el archivo, así que un desajuste se ve enseguida.
 */
export function countPages(pdf: Buffer): number {
  const raw = pdf.toString('latin1');
  const matches = raw.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches ? matches.length : 0;
}

export interface ExtractionProgress {
  batch: number;
  batches: number;
  fromPage: number;
  toPage: number;
  /** Presente solo cuando la tanda falló y se está reintentando. */
  retrying?: string;
}

/**
 * CADENA DE RESPALDO ENTRE MODELOS.
 *
 * Los reintentos con espera creciente resuelven una saturación pasajera. No
 * resuelven una sostenida: contra el documento real, un modelo devolvió 503
 * cuatro veces seguidas en la misma tanda y tiró por tierra las cuatro
 * anteriores.
 *
 * Así que si un modelo sigue saturado tras agotar los reintentos, se pasa al
 * siguiente en vez de abandonar la transcripción. La calidad baja un poco;
 * quedarse sin nada es mucho peor.
 */
export async function extractPdf(
  client: GoogleGenAI,
  models: string[],
  filePath: string,
  pageCount: number,
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<string> {
  const uploaded = await withRetry(
    'subida del archivo',
    () =>
      client.files.upload({
        file: filePath,
        config: { mimeType: 'application/pdf' },
      }),
    {
      onRetry: (message) =>
        onProgress?.({
          batch: 0,
          batches: 0,
          fromPage: 0,
          toPage: 0,
          retrying: message,
        }),
    },
  );

  if (!uploaded.uri || !uploaded.mimeType) {
    throw new Error(
      'Gemini no devolvió una referencia utilizable del archivo.',
    );
  }

  const batches = Math.max(1, Math.ceil(pageCount / PAGES_PER_BATCH));
  const parts: string[] = [];

  for (let index = 0; index < batches; index += 1) {
    const fromPage = index * PAGES_PER_BATCH + 1;
    const toPage = Math.min(pageCount, fromPage + PAGES_PER_BATCH - 1);
    onProgress?.({ batch: index + 1, batches, fromPage, toPage });

    const response = await withFallback(
      models,
      `páginas ${fromPage}–${toPage}`,
      (model) =>
        client.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  fileData: {
                    fileUri: uploaded.uri,
                    mimeType: uploaded.mimeType,
                  },
                },
                {
                  text: PROMPT.replace(
                    '{RANGE}',
                    fromPage === toPage
                      ? `${fromPage}`
                      : `${fromPage} a ${toPage}`,
                  ),
                },
              ],
            },
          ],
          // Temperatura al mínimo: esto es transcripción, no redacción.
          // Cualquier creatividad aquí altera el material de Luifer.
          config: { temperature: 0 },
        }),
      {
        onRetry: (message) =>
          onProgress?.({
            batch: index + 1,
            batches,
            fromPage,
            toPage,
            retrying: message,
          }),
      },
    );

    const text = response.text?.trim();
    if (!text) {
      throw new Error(
        `La extracción devolvió vacío en las páginas ${fromPage}–${toPage}.`,
      );
    }
    parts.push(stripFences(text));
  }

  // El archivo subido se borra: ya está transcrito y guardado en Mongo, y
  // dejarlo en Gemini es una copia del material sin ninguna utilidad.
  if (uploaded.name) {
    await client.files.delete({ name: uploaded.name }).catch(() => undefined);
  }

  return parts.join('\n\n');
}

/** A veces devuelve el Markdown envuelto en cercas de código pese a pedirlo. */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|md)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .trim();
}

export interface ParsedSection {
  order: number;
  title: string;
  body: string;
  edited: boolean;
}

/** Parte el Markdown por títulos de segundo nivel, para poder revisarlo. */
export function splitSections(markdown: string): ParsedSection[] {
  const lines = markdown.split('\n');
  const sections: ParsedSection[] = [];
  let title = 'Introducción';
  let body: string[] = [];

  const push = () => {
    const text = body.join('\n').trim();
    if (text.length > 0 || sections.length === 0) {
      sections.push({
        order: sections.length,
        title,
        body: text,
        edited: false,
      });
    }
  };

  for (const line of lines) {
    const heading = /^##\s+(?!#)(.+)$/.exec(line);
    if (heading) {
      push();
      title = heading[1].trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  push();

  return sections;
}
