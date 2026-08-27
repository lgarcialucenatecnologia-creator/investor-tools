import type { Metadata } from 'next';
import { FilterScreen } from '@/components/filter/filter-screen';
import type { Analysis, FilterForm } from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Filtro de Seguridad' };

export default async function FiltroPage() {
  // En paralelo: son dos consultas independientes y encadenarlas solo
  // sumaría la latencia de una a la de la otra.
  const [form, history] = await Promise.all([
    fetchWithSession<FilterForm>('/filter/form'),
    fetchWithSession<Analysis[]>('/filter'),
  ]);

  return <FilterScreen form={form} initialHistory={history} />;
}
