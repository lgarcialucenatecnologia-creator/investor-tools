import type { Author } from '@/lib/api/types';

/**
 * Un mensaje.
 *
 * El texto se pinta con `whitespace-pre-wrap` en vez de convertir Markdown:
 * el Consultor usa listas y negritas ocasionales, y un intérprete completo
 * traería una dependencia y un riesgo de inyección por una ganancia menor.
 * Lo único que se resuelve es la negrita, que sí aparece a menudo.
 */
export function MessageBubble({
  author,
  text,
  pending,
}: {
  author: Author;
  text: string;
  pending?: boolean;
}) {
  const mine = author === 'person';

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[min(46rem,88%)] rounded-lg px-5 py-3.5 leading-relaxed ${
          mine
            ? 'bg-nocturno text-marfil'
            : 'border border-azul/30 bg-azul/10 text-marfil/90'
        }`}
      >
        <p className="whitespace-pre-wrap">
          {renderBold(text)}
          {pending && (
            <span
              aria-label="escribiendo"
              className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-dorado align-text-bottom"
            />
          )}
        </p>
      </div>
    </div>
  );
}

/** Solo **negrita**, que es lo que de verdad usa. Nada de HTML crudo. */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((piece, index) =>
    piece.startsWith('**') && piece.endsWith('**') ? (
      <strong key={index} className="text-marfil">
        {piece.slice(2, -2)}
      </strong>
    ) : (
      piece
    ),
  );
}
