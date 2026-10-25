'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { readChatStream } from '@/lib/consultant-stream';
import { shortDate } from '@/lib/format';
import type {
  ChatMessage,
  ChatStep,
  ConversationDetail,
  ConversationSummary,
} from '@/lib/api/types';
import { MessageBubble } from './message-bubble';
import { Tracing } from './tracing';

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
  /** En qué va la espera. Lo dice el backend, no lo adivina la pantalla. */
  const [step, setStep] = useState<ChatStep | null>(null);
  /** Esperas de las otras dos peticiones: abrir y borrar una conversación. */
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
    setLoadingId(id);
    try {
      const detail = await api<ConversationDetail>(
        `/consultant/conversations/${id}`,
      );
      setActiveId(detail.id);
      setMessages(detail.messages);
      setStreaming('');
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoadingId(null);
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
    setLoadingId(id);
    try {
      await api(`/consultant/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (activeId === id) fresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  async function send(question: string) {
    const clean = question.trim();
    if (clean.length < 2 || busy) return;

    setBusy(true);
    setError(null);
    setFailed(null);
    setStep('material');
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
        if (event.type === 'step') {
          setStep(event.step);
        } else if (event.type === 'chunk') {
          // La primera palabra retira la espera: ya no hay nada que anunciar.
          setStep(null);
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
      setStep(null);
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
      <aside className="surface flex shrink-0 flex-col gap-2 p-3 lg:w-72">
        <Button type="button" variant="outline" onClick={fresh}>
          <MessageSquarePlus size={15} />
          Nueva conversación
        </Button>

        {conversations.length > 0 && (
          <p className="px-2 pt-3 pb-1 text-[0.68rem] uppercase tracking-[0.22em] text-grafito-texto">
            Tus conversaciones
          </p>
        )}
        {conversations.length > 0 && (
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto lg:max-h-none">
            {conversations.map((item) => (
              <li
                key={item.id}
                className={`group flex items-center gap-1 transition-opacity ${
                  loadingId === item.id ? 'opacity-40' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => void open(item.id)}
                  aria-current={activeId === item.id ? 'true' : undefined}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    activeId === item.id
                      ? 'bg-marfil/[0.07] text-marfil'
                      : 'text-marfil/65 hover:bg-marfil/[0.04] hover:text-marfil'
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
          {loadingId && messages.length === 0 && !streaming ? (
            <div className="py-8">
              <Tracing label="Abriendo la conversación" />
            </div>
          ) : messages.length === 0 && !streaming ? (
            <div className="surface-azul animate-rise flex flex-col gap-6 p-7">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-marfil/10 ring-1 ring-marfil/20">
                  <MessagesSquare size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="font-display text-2xl leading-tight">
                    Pregúntame lo que necesites
                  </h2>
                  <p className="mt-2 max-w-xl leading-relaxed text-marfil/75">
                    Respondo con el método de Luifer. Si no tengo un dato
                    confirmado, te lo digo — no me lo invento.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {ARRANQUES.map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => void send(texto)}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-marfil/15 bg-marfil/[0.07] px-4 py-3.5 text-left text-sm text-marfil/90 transition-colors hover:border-marfil/35 hover:bg-marfil/[0.12]"
                  >
                    {texto}
                    <ArrowUpRight
                      size={16}
                      className="mt-0.5 shrink-0 text-marfil/50 transition-colors group-hover:text-marfil"
                    />
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
              {busy && !streaming && <Tracing step={step ?? 'material'} />}
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

        {/* Una sola superficie con el botón adentro: así se escribe en los
            chats que la gente ya usa todos los días. */}
        <form
          onSubmit={submit}
          className="surface mt-4 flex items-end gap-2 rounded-2xl p-2 focus-within:border-dorado/40"
        >
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
            className="min-h-[3.25rem] flex-1 resize-none bg-transparent px-3 py-3 text-marfil outline-none placeholder:text-grafito-texto"
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={busy || draft.trim().length < 2}
            aria-label="Enviar"
            className="size-11 rounded-xl"
          >
            {busy ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
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
