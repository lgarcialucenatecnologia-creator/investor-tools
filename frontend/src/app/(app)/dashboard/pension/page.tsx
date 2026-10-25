import type { Metadata } from 'next';
import { PageContainer } from '@/components/app/page-header';
import { PensionScreen } from '@/components/pension/pension-screen';
import type { PensionOverview } from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Mi Meta de Pensión' };

export default async function PensionPage() {
  const overview = await fetchWithSession<PensionOverview>('/pension');
  return (
    <PageContainer>
      <PensionScreen initial={overview} />
    </PageContainer>
  );
}
