import type { Metadata } from 'next';
import { MessagesSquare } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/app/page-header';
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
    <PageContainer wide fill>
      <div className="flex h-full min-h-0 flex-col gap-8">
        <PageHeader
          icon={MessagesSquare}
          accent="azul"
          eyebrow="Acompañamiento directo"
          title="Consultor Luifer"
          description="Tu guía del método cuando la necesites, con lo que ya hiciste en la plataforma. Las conversaciones quedan guardadas."
        />

        <ChatScreen initialConversations={conversations} />
      </div>
    </PageContainer>
  );
}
