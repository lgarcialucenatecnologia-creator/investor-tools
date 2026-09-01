import type { Metadata } from 'next';
import { RouteScreen } from '@/components/route/route-screen';
import type { RouteOverview } from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Mi Ruta de 90 Días' };

export default async function RutaPage() {
  const overview = await fetchWithSession<RouteOverview>('/route');
  return <RouteScreen initial={overview} />;
}
