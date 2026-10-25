'use client';

import { Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import type { ChecklistSummary } from '@/lib/api/types';
import { shortDate } from '@/lib/format';
import { STATUS_CHIP } from './status';

export function ProjectsDialog({
  open,
  onOpenChange,
  projects,
  currentId,
  onOpen,
  onDelete,
  busyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ChecklistSummary[];
  currentId: string | null;
  onOpen: (project: ChecklistSummary) => void;
  onDelete: (project: ChecklistSummary) => void;
  busyId: string | null;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mis proyectos"
      description={
        projects.length === 0
          ? undefined
          : `${projects.length} proyecto${projects.length === 1 ? '' : 's'} guardado${projects.length === 1 ? '' : 's'}.`
      }
    >
      {projects.length === 0 ? (
        <p className="py-6 text-center text-sm text-grafito-texto">
          Todavía no has guardado ninguno. Ponle nombre al proyecto y pulsa
          «Guardar checklist».
        </p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {projects.map((project) => {
            const isCurrent = project.id === currentId;
            return (
              <li
                key={project.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  isCurrent ? 'border-dorado/40' : 'border-grafito/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpen(project)}
                  disabled={busyId === project.id}
                  className="min-w-0 flex-1 text-left disabled:opacity-50"
                >
                  <p className="truncate text-sm text-marfil">
                    {project.projectName}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-dorado">abierto</span>
                    )}
                  </p>
                  <p className="text-xs text-grafito-texto">
                    {project.projectType === 'vis' ? 'VIS' : 'NO VIS'} ·{' '}
                    {project.evaluated}/{project.total} evaluados ·{' '}
                    {shortDate.format(new Date(project.updatedAt))}
                  </p>
                </button>

                <span className="text-xs tabular-nums text-grafito-texto">
                  {project.score === null ? '—' : `${project.score}%`}
                </span>
                <span
                  className={`hidden whitespace-nowrap rounded border px-2 py-0.5 text-xs sm:inline ${STATUS_CHIP[project.status]}`}
                >
                  {project.label}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  disabled={busyId === project.id}
                  aria-label={`Borrar ${project.projectName}`}
                  title="Borrar"
                  className="grid size-8 shrink-0 place-items-center rounded-md text-grafito-texto transition-colors hover:text-alerta disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
