import type { ChatEvent } from './api/types';

/**
 * Lee la respuesta del Consultor a medida que llega.
 *
 * El formato son eventos del servidor: líneas «data: {...}» separadas por una
 * línea en blanco. Hay que acumular en un buffer porque un trozo de red puede
 * cortar un evento por la mitad — y ahí `JSON.parse` falla y se pierde texto.
 */
export async function* readChatStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Se procesa hasta el último separador completo; lo que quede se guarda.
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      if (!raw.startsWith('data:')) continue;
      try {
        yield JSON.parse(raw.slice(5).trim()) as ChatEvent;
      } catch {
        // Un evento ilegible se ignora: mejor perder una palabra que romper
        // la conversación entera.
      }
    }
  }
}
