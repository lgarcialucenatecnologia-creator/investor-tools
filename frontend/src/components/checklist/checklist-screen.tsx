'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCheck, FolderOpen, Loader2, Plus, Save } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api/client';
import type {
  ChecklistEvaluation,
  ChecklistForm,
  ChecklistSummary,
  ProjectType,
  SavedChecklist,
} from '@/lib/api/types';
import { ExecutiveSummary } from './executive-summary';
import { ItemCard } from './item-card';
import { ProjectsDialog } from './projects-dialog';
import { STATUS_CHIP, sectionAnchor } from './status';

type Ratings = Record<string, number | undefined>;
type Notes = Record<string, string>;

const TYPES: { value: ProjectType; label: string }[] = [
  { value: 'vis', label: 'VIS' },
  { value: 'no_vis', label: 'NO VIS' },
];

const appliesTo = (type: ProjectType) => (item: { appliesTo?: ProjectType }) =>
  !item.appliesTo || item.appliesTo === type;

/**
 * El resultado antes de la primera respuesta del backend: todo en blanco.
 * Evita que la pantalla arranque con un hueco mientras llega el cálculo.
 */
function blankEvaluation(
  form: ChecklistForm,
  type: ProjectType,
): ChecklistEvaluation {
  const sections = form.sections.map((section) => ({
    id: section.id,
    name: section.name,
    weight: section.weight,
    score: null,
    evaluated: 0,
    total: section.items.filter(appliesTo(type)).length,
  }));
  return {
    score: null,
    coverage: 0,
    evaluated: 0,
    total: sections.reduce((sum, s) => sum + s.total, 0),
    status: 'sin_evaluar',
    label: 'Sin evaluar',
    summary:
      'Califica cada punto de 1 a 5 a medida que lo averigües. El resultado se va armando solo.',
    sections,
    weakItems: [],
  };
}

export function ChecklistScreen({
  form,
  initialProjects,
  initialProject,
}: {
  form: ChecklistForm;
  initialProjects: ChecklistSummary[];
  /** El último proyecto en el que trabajó, para seguir donde iba. */
  initialProject: SavedChecklist | null;
}) {
  const [currentId, setCurrentId] = useState<string | null>(
    initialProject?.id ?? null,
  );
  const [projectName, setProjectName] = useState(
    initialProject?.projectName ?? '',
  );
  const [projectType, setProjectType] = useState<ProjectType>(
    initialProject?.projectType ?? 'no_vis',
  );
  const [ratings, setRatings] = useState<Ratings>(initialProject?.ratings ?? {});
  const [notes, setNotes] = useState<Notes>(initialProject?.notes ?? {});
  const [evaluation, setEvaluation] = useState<ChecklistEvaluation>(
    initialProject?.result ??
      blankEvaluation(form, initialProject?.projectType ?? 'no_vis'),
  );

  const [projects, setProjects] = useState(initialProjects);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(
    initialProject?.updatedAt ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const cleanRatings = useMemo(() => {
    const clean: Record<string, number> = {};
    for (const [id, value] of Object.entries(ratings)) {
      if (value !== undefined) clean[id] = value;
    }
    return clean;
  }, [ratings]);

  /*
    Se recalcula al calificar, con espera: aquí se califica rápido y seguido,
    y sin la espera cada clic sería una petición. El contador descarta las
    respuestas que llegan tarde, de un estado que ya cambió.
  */
  const request = useRef(0);
  useEffect(() => {
    const ticket = ++request.current;
    const id = window.setTimeout(() => {
      api<ChecklistEvaluation>('/checklist/assess', {
        method: 'POST',
        body: JSON.stringify({ projectType, ratings: cleanRatings }),
      })
        .then((result) => {
          if (ticket === request.current) setEvaluation(result);
        })
        .catch((caught: Error) => setError(caught.message));
    }, 300);
    return () => window.clearTimeout(id);
  }, [projectType, cleanRatings]);

  // Cerrar la pestaña con cambios sin guardar pide confirmación.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function rate(itemId: string, value: number | undefined) {
    setRatings((prev) => ({ ...prev, [itemId]: value }));
    setDirty(true);
  }

  function writeNote(itemId: string, value: string) {
    setNotes((prev) => ({ ...prev, [itemId]: value }));
    setDirty(true);
  }

  function confirmDiscard() {
    return (
      !dirty ||
      window.confirm(
        'Tienes cambios sin guardar en este proyecto. ¿Seguir sin guardarlos?',
      )
    );
  }

  function load(project: SavedChecklist | null) {
    setCurrentId(project?.id ?? null);
    setProjectName(project?.projectName ?? '');
    setProjectType(project?.projectType ?? 'no_vis');
    setRatings(project?.ratings ?? {});
    setNotes(project?.notes ?? {});
    setEvaluation(
      project?.result ?? blankEvaluation(form, project?.projectType ?? 'no_vis'),
    );
    setSavedAt(project?.updatedAt ?? null);
    setDirty(false);
    setError(null);
  }

  function handleNew() {
    if (!confirmDiscard()) return;
    load(null);
  }

  async function handleOpen(summary: ChecklistSummary) {
    if (summary.id !== currentId && !confirmDiscard()) return;
    setBusyId(summary.id);
    try {
      load(await api<SavedChecklist>(`/checklist/${summary.id}`));
      setPickerOpen(false);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(summary: ChecklistSummary) {
    if (
      !window.confirm(
        `¿Borrar «${summary.projectName}» con todas sus calificaciones y observaciones? No se puede deshacer.`,
      )
    ) {
      return;
    }
    setBusyId(summary.id);
    try {
      await api(`/checklist/${summary.id}`, { method: 'DELETE' });
      setProjects(await api<ChecklistSummary[]>('/checklist'));
      if (summary.id === currentId) load(null);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSave() {
    if (projectName.trim().length < 2) {
      setError('Ponle un nombre al proyecto para poder guardarlo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify({
        projectName: projectName.trim(),
        projectType,
        ratings: cleanRatings,
        notes,
      });
      const saved = currentId
        ? await api<SavedChecklist>(`/checklist/${currentId}`, {
            method: 'PUT',
            body,
          })
        : await api<SavedChecklist>('/checklist', { method: 'POST', body });

      setCurrentId(saved.id);
      setEvaluation(saved.result);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setProjects(await api<ChecklistSummary[]>('/checklist'));
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const saveState = dirty
    ? 'Cambios sin guardar'
    : savedAt
      ? `Guardado el ${new Date(savedAt).toLocaleString('es-CO', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      : 'Aún no lo has guardado';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={ClipboardCheck}
        eyebrow="Punto por punto"
        title="Check List"
        description="Califica de 1 a 5 cada criterio del proyecto a medida que lo averigües, y anota lo que te respondan. Lo que todavía no sabes no cuenta en contra: solo deja el resultado incompleto."
        actions={
          <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
          >
            <FolderOpen size={15} />
            Mis proyectos
            {projects.length > 0 && (
              <span className="ml-1 rounded bg-dorado px-1.5 text-xs tabular-nums text-obsidiana">
                {projects.length}
              </span>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleNew}>
            <Plus size={15} />
            Proyecto nuevo
          </Button>
          </>
        }
      />

      <section className="grid gap-6 surface p-7 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="checklist-project">Nombre del proyecto</Label>
            <Input
              id="checklist-project"
              value={projectName}
              onChange={(event) => {
                setProjectName(event.target.value);
                setDirty(true);
              }}
              placeholder="Torre Aralia, apto 402"
              maxLength={140}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm text-marfil">Tipo</legend>
            <div className="flex gap-2">
              {TYPES.map((option) => {
                const selected = projectType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setProjectType(option.value);
                      setDirty(true);
                    }}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      selected
                        ? 'border-dorado bg-dorado/10 text-dorado'
                        : 'border-grafito/30 text-marfil/60 hover:border-grafito/60 hover:text-marfil'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="flex min-w-56 flex-col gap-3 rounded-lg border border-grafito/20 bg-obsidiana/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
            Resultado
          </p>
          <p className="font-display text-4xl tabular-nums text-marfil">
            {evaluation.score === null ? '—' : `${evaluation.score}%`}
          </p>
          <span
            className={`self-start whitespace-nowrap rounded border px-2 py-0.5 text-xs ${STATUS_CHIP[evaluation.status]}`}
          >
            {evaluation.label}
          </span>
          <div>
            <div className="h-1.5 overflow-hidden rounded bg-grafito/25">
              <span
                className="block h-full rounded bg-marfil/70 transition-[width] duration-300"
                style={{ width: `${evaluation.coverage}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-grafito-texto">
              {evaluation.evaluated}/{evaluation.total} evaluados ·{' '}
              {evaluation.coverage}% del peso
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-marfil/70 md:col-span-2">
          {evaluation.summary}
        </p>
      </section>

      <ExecutiveSummary evaluation={evaluation} />

      {form.sections.map((section, index) => {
        const items = section.items.filter(appliesTo(projectType));
        const result = evaluation.sections.find((s) => s.id === section.id);
        return (
          <section
            key={section.id}
            id={sectionAnchor(section.id)}
            className="scroll-mt-6 surface p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-grafito-texto">
                  Criterio {String(index + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-2 font-display text-xl text-marfil">
                  {section.name}
                </h2>
                <p className="mt-1 text-xs text-grafito-texto">
                  Peso general {section.weight}% · {result?.evaluated ?? 0}/
                  {items.length} evaluados
                </p>
              </div>
              <div className="shrink-0 rounded-lg border border-grafito/20 bg-obsidiana/60 px-4 py-2 text-right">
                <p className="text-xs text-grafito-texto">Puntaje</p>
                <p className="font-display text-xl tabular-nums text-marfil">
                  {result?.score == null ? '—' : `${result.score}%`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  rating={ratings[item.id]}
                  note={notes[item.id] ?? ''}
                  onRate={(value) => rate(item.id, value)}
                  onNote={(value) => writeNote(item.id, value)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Fija abajo del panel: con 41 puntos, guardar no puede depender de
          volver arriba. */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-grafito/30 bg-nocturno/95 px-5 py-3 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-display text-lg tabular-nums text-marfil">
            {evaluation.score === null ? '—' : `${evaluation.score}%`}
          </span>
          <span className="text-grafito-texto">
            {evaluation.evaluated}/{evaluation.total}
          </span>
          <span
            role="status"
            className={dirty ? 'text-oro' : 'text-grafito-texto'}
          >
            {saveState}
          </span>
        </div>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <Save size={15} />
              Guardar checklist
            </>
          )}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-alerta"
        >
          {error}
        </p>
      )}

      <ProjectsDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        projects={projects}
        currentId={currentId}
        onOpen={(project) => void handleOpen(project)}
        onDelete={(project) => void handleDelete(project)}
        busyId={busyId}
      />
    </div>
  );
}
