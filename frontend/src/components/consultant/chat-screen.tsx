'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, MessageSquarePlus, RotateCcw, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { readChatStream } from '@/lib/consultant-stream';
import { shortDate } from '@/lib/format';
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from '@/lib/api/types';
import { MessageBubble } from './message-bubble';

const ARRANQUES = [
  '¿Por dónde empiezo el programa?',
  '¿Qué es el Método OPORTUNO?',
  '¿Cómo sé cuánto puedo invertir?',
  'Me ofrecieron un apartamento. ¿Qué reviso primero?',
];

export function ChatScreen({
  initialConversations,
}: {
  initialConversations: ConversationSummary[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * La pregunta que falló, guardada para poder reintentarla.
   *
   * Sin esto, un pico de demanda del proveedor obliga a reescribir lo que ya
   * se había escrito. Y como la pregunta ya se pintó en pantalla, se ve como
   * si el Consultor la hubiera ignorado.
   */
  const [failed, setFailed] = useState<string | null>(null);

  const bottom = useRef<HTMLDivElement>(null);

  // Cada mensaje nuevo empuja la vista al final, como cualquier chat.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streaming]);

  async function open(id: string) {
    setError(null);
    try {
      const detail = await api<ConversationDetail>(
        `/consultant/conversations/${id}`,
      );
      setActiveId(detail.id);
      setMessages(detail.messages);
      setStreaming('');
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  function fresh() {
    setActiveId(null);
    setMessages([]);
    setStreaming('');
    setError(null);
  }

  async function remove(id: string) {
    if (!window.confirm('¿Borrar esta conversación? No se puede deshacer.')) return;
    try {
      await api(`/consultant/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (activeId === id) fresh();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function send(question: string) {
    const clean = question.trim();
    if (clean.length < 2 || busy) return;

    setBusy(true);
    setError(null);
    setFailed(null);
    setDraft('');
    setMessages((prev) => [
      ...prev,
      { author: 'person', text: clean, at: new Date().toISOString() },
    ]);

    let answer = '';
    try {
      const response = await fetch('/api/consultant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clean,
          ...(activeId ? { conversationId: activeId } : {}),
        }),
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? 'No pude conectar con el Consultor.');
      }

      for await (const event of readChatStream(response.body)) {
        if (event.type === 'chunk') {
          answer += event.text;
          setStreaming(answer);
        } else if (event.type === 'done') {
          setActiveId(event.conversationId);
          setConversations(
            await api<ConversationSummary[]>('/consultant/conversations'),
          );
        } else {
          throw new Error(event.message);
        }
      }

      setMessages((prev) => [
        ...prev,
        { author: 'consultant', text: answer, at: new Date().toISOString() },
      ]);
    } catch (caught) {
      setError((caught as Error).message);
      if (answer) {
        // Media respuesta se conserva: puede ser útil, y borrarla sería
        // tirar algo que ya se pagó.
        setMessages((prev) => [
          ...prev,
          { author: 'consultant', text: answer, at: new Date().toISOString() },
        ]);
      } else {
        // Sin nada que mostrar, se retira la pregunta de la pantalla y se
        // guarda para reintentar: dejarla suelta ahí parece que la ignoró.
        setMessages((prev) => prev.slice(0, -1));
        setFailed(clean);
      }
    } finally {
      setStreaming('');
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 lg:flex-row">
      {/* Las conversaciones guardadas. Segundo plano: lo primero es escribir. */}
      <aside className="flex shrink-0 flex-col gap-2 lg:w-64">
        <Button type="button" variant="outline" onClick={fresh}>
          <MessageSquarePlus size={15} />
          Nueva conversación
        </Button>

        {conversations.length > 0 && (
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto lg:max-h-none">
            {conversations.map((item) => (
              <li key={item.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void open(item.id)}
                  aria-current={activeId === item.id ? 'true' : undefined}
                  className={`min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    activeId === item.id
                      ? 'bg-nocturno text-marfil'
                      : 'text-grafito-texto hover:bg-nocturno/60 hover:text-marfil'
                  }`}
                >
                  <span className="block truncate">{item.title}</span>
                  <span className="block text-xs text-grafito-texto">
                    {shortDate.format(new Date(item.lastMessageAt))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void remove(item.id)}
                  aria-label={`Borrar «${item.title}»`}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-grafito-texto opacity-0 transition-opacity hover:text-alerta focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !streaming ? (
            <div className="flex flex-col gap-6 py-8">
              <div>
                <h2 className="font-display text-2xl text-marfil">
                  Pregúntame lo que necesites
                </h2>
                <p className="mt-3 max-w-xl leading-relaxed text-marfil/70">
                  Respondo con el método de Luifer. Si no tengo un dato
                  confirmado, te lo digo — no me lo invento.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ARRANQUES.map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => void send(texto)}
                    className="rounded-md border border-grafito/30 px-4 py-2 text-sm text-marfil/80 transition-colors hover:border-dorado hover:text-dorado"
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  author={message.author}
                  text={message.text}
                />
              ))}
              {streaming && (
                <MessageBubble author="consultant" text={streaming} pending />
              )}
              {busy && !streaming && (
                <div className="flex items-center gap-2 px-2 text-sm text-grafito-texto">
                  <Loader2 className="animate-spin" size={14} />
                  Pensando…
                </div>
              )}
            </div>
          )}
          <div ref={bottom} />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
          >
            <p className="min-w-0 flex-1">{error}</p>
            {failed && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void send(failed)}
              >
                <RotateCcw size={14} />
                Reintentar
              </Button>
            )}
          </div>
        )}

        {/* La pregunta que no salió queda visible: se ve que no se perdió. */}
        {failed && !busy && (
          <p className="mt-2 text-xs text-grafito-texto">
            Sin enviar: «{failed.length > 90 ? `${failed.slice(0, 90)}…` : failed}»
          </p>
        )}

        <form onSubmit={submit} className="mt-4 flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter envía; Mayús+Enter salta línea. Es lo que la mano espera.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            placeholder="Escribe tu pregunta…"
            aria-label="Tu pregunta"
            className="min-h-[3.25rem] flex-1 resize-none rounded-md border border-input bg-transparent px-4 py-3 text-marfil outline-none placeholder:text-grafito-texto focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button type="submit" disabled={busy || draft.trim().length < 2}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} />}
            Enviar
          </Button>
        </form>

        <p className="mt-2 text-xs text-grafito-texto">
          Orientación educativa. No reemplaza a un abogado, un contador ni un
          asesor profesional.
        </p>
      </section>
    </div>
  );
}
