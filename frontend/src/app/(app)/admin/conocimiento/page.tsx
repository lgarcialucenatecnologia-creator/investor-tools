import type { Metadata } from 'next';
import { KnowledgeScreen } from '@/components/knowledge/knowledge-screen';
import type { KnowledgeSummary } from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Base de conocimiento' };

export default async function ConocimientoPage() {
  const versions =
    await fetchWithSession<KnowledgeSummary[]>('/knowledge');
  return <KnowledgeScreen initialVersions={versions} />;
}
