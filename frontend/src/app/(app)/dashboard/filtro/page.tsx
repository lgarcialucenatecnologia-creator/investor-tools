import type { Metadata } from 'next';
import { FilterScreen } from '@/components/filter/filter-screen';
import type { Analysis, FilterDefaults } from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Filtro de Seguridad' };

export default async function FiltroPage() {
  // En paralelo: son dos consultas independientes y encadenarlas solo
  // sumaría la latencia de una a la de la otra.
  const [defaults, history] = await Promise.all([
    fetchWithSession<FilterDefaults>('/filter/defaults'),
    fetchWithSession<Analysis[]>('/filter'),
  ]);

  return <FilterScreen defaults={defaults} initialHistory={history} />;
}
