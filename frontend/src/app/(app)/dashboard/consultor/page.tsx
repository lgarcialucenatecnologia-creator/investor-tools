import type { Metadata } from 'next';
import { ChatScreen } from '@/components/consultant/chat-screen';
import type { ConversationSummary } from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Consultor Luifer' };

export default async function ConsultorPage() {
  // Si falla, se entra igual con la lista vacía: no poder ver el histórico no
  // debe impedir hacer una pregunta nueva.
  const conversations = await fetchWithSession<ConversationSummary[]>(
    '/consultant/conversations',
  ).catch(() => [] as ConversationSummary[]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-8">
      <header className="shrink-0">
        <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
          Acompañamiento directo
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight text-marfil">
          Consultor Luifer
        </h1>
      </header>

      <ChatScreen initialConversations={conversations} />
    </div>
  );
}
