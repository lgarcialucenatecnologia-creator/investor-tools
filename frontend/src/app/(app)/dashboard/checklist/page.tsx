import type { Metadata } from 'next';
import { PageContainer } from '@/components/app/page-header';
import { ChecklistScreen } from '@/components/checklist/checklist-screen';
import type {
  ChecklistForm,
  ChecklistSummary,
  SavedChecklist,
} from '@/lib/api/types';
import { fetchWithSession } from '@/lib/session/fetch-server';

export const metadata: Metadata = { title: 'Check List' };

export default async function ChecklistPage() {
  // En paralelo: son dos consultas independientes.
  const [form, projects] = await Promise.all([
    fetchWithSession<ChecklistForm>('/checklist/form'),
    fetchWithSession<ChecklistSummary[]>('/checklist'),
  ]);

  // Se abre el último en el que trabajó: un checklist se completa en varias
  // sesiones, a medida que llegan las respuestas de la constructora.
  const initialProject = projects[0]
    ? await fetchWithSession<SavedChecklist>(`/checklist/${projects[0].id}`)
    : null;

  return (
    <PageContainer>
      <ChecklistScreen
        form={form}
        initialProjects={projects}
        initialProject={initialProject}
      />
    </PageContainer>
  );
}
