import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  MessagesSquare,
  Route,
  Target,
} from 'lucide-react';
import { ProgressRing } from '@/components/app/progress-ring';
import { STATUS_CHIP } from '@/components/checklist/status';
import type {
  ChecklistSummary,
  ConversationSummary,
  PensionOverview,
  RouteOverview,
} from '@/lib/api/types';
import { millions } from '@/lib/format';
import { fetchWithSession } from '@/lib/session/fetch-server';
import { getSession } from '@/lib/session/server';

export const metadata: Metadata = { title: 'Inicio' };

/** Si una herramienta falla, el resto del panel se muestra igual. */
const safe = <T,>(promise: Promise<T>) => promise.catch(() => null);

const SUGGESTIONS = [
  '¿Por dónde empiezo?',
  'Me ofrecieron un apartamento, ¿qué reviso?',
  '¿Cómo sé cuánto puedo invertir?',
];

/**
 * El panel calcula, no solo enlaza. Cada celda muestra el estado real de su
 * herramienta —en qué día de la Ruta vas, qué tan cerca estás de tu meta,
 * qué proyectos evaluaste— y si todavía no la usas, el primer paso.
 */
export default async function DashboardHome() {
  const user = await getSession();
  const [route, pension, projects, conversations] = await Promise.all([
    safe(fetchWithSession<RouteOverview>('/route')),
    safe(fetchWithSession<PensionOverview>('/pension')),
    safe(fetchWithSession<ChecklistSummary[]>('/checklist')),
    safe(fetchWithSession<ConversationSummary[]>('/consultant/conversations')),
  ]);

  const firstName =
    user?.fullName?.trim().split(/\s+/)[0] ?? user?.email.split('@')[0] ?? '';
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const routeDone = route?.blocks.reduce((sum, b) => sum + b.done, 0) ?? 0;
  const routeTotal = route?.blocks.reduce((sum, b) => sum + b.total, 0) ?? 0;
  const currentBlock = route?.blocks.find((b) => b.current);
  const nextTask = currentBlock?.tasks.find((t) => !t.done);
  const result = pension?.result ?? null;
  const lastConversation = conversations?.[0];

  const summary = [
    route?.started ? `Día ${route.day} de tu Ruta` : null,
    result ? `meta al ${result.progress}%` : null,
    projects?.length
      ? `${projects.length} proyecto${projects.length === 1 ? '' : 's'} evaluado${projects.length === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-4 lg:grid-cols-6 lg:auto-rows-[minmax(0,auto)]">
      {/* ---- Saludo ---- */}
      <section
        className="surface animate-rise overflow-hidden p-8 lg:col-span-4"
        style={{ '--d': '0ms' } as React.CSSProperties}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-dorado/10 blur-3xl"
        />
        <p className="relative text-xs uppercase tracking-[0.24em] text-grafito-texto first-letter:uppercase">
          {today}
        </p>
        <h1 className="relative mt-4 font-display text-4xl leading-[1.05] tracking-tight text-marfil md:text-5xl">
          Hola, {firstName}
        </h1>
        <p className="relative mt-4 max-w-xl text-[1.05rem] leading-relaxed text-marfil/70">
          {summary.length > 0
            ? `${summary.join(' · ')}. Lo básico es lo que funciona: un paso a la vez.`
            : 'Lo básico es lo que funciona. Empieza por tu Ruta: ahí está el orden de todo lo demás.'}
        </p>
        <div className="relative mt-7 flex flex-wrap gap-2">
          <QuickLink href="/dashboard/ruta" icon={Route}>
            Mi Ruta
          </QuickLink>
          <QuickLink href="/dashboard/checklist" icon={ClipboardCheck}>
            Evaluar un proyecto
          </QuickLink>
          <QuickLink href="/dashboard/pension" icon={Target}>
            Mi meta
          </QuickLink>
        </div>
      </section>

      {/* ---- Mi Meta de Pensión: el resultado clave, la única celda dorada ---- */}
      <Link
        href="/dashboard/pension"
        className="surface-gold surface-link animate-rise flex flex-col justify-between gap-6 overflow-hidden p-7 lg:col-span-2 lg:row-span-2"
        style={{ '--d': '80ms' } as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-obsidiana/70">
              Mi Meta de Pensión
            </p>
            <p className="mt-3 font-display text-4xl leading-none tabular-nums">
              {result ? millions(result.targetCapital) : 'Sin calcular'}
            </p>
          </div>
          <ArrowUpRight size={20} className="shrink-0 text-obsidiana/70" />
        </div>

        {result ? (
          <>
            <div className="flex items-center gap-5">
              <ProgressRing
                value={result.progress}
                tone="obsidiana"
                size={104}
                label={`Llevas el ${result.progress}% de tu meta`}
              >
                <span className="font-display text-2xl tabular-nums">
                  {result.progress}%
                </span>
              </ProgressRing>
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-obsidiana/65">Tienes hoy</dt>
                  <dd className="font-medium tabular-nums">
                    {millions(result.startingCapital)}
                  </dd>
                </div>
                <div>
                  <dt className="text-obsidiana/65">Te falta</dt>
                  <dd className="font-medium tabular-nums">
                    {millions(result.gap)}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-sm leading-snug text-obsidiana/80">
              {result.reachedInMonths === null
                ? 'A este ritmo no llegas todavía. Mira qué mover.'
                : result.reachedInMonths === 0
                  ? 'Ya llegaste: tu capital paga tu vida.'
                  : `Llegas en ${Math.ceil(result.reachedInMonths / 12)} años a tu ritmo actual.`}
            </p>
          </>
        ) : (
          <>
            <ProgressRing
              value={0}
              tone="obsidiana"
              size={128}
              label="Todavía no has calculado tu meta"
            >
              <Target size={34} strokeWidth={1.6} className="text-obsidiana/60" />
            </ProgressRing>
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-obsidiana/80">
                Cuánto capital necesitas para vivir de rentas sin tocarlo, y
                cuándo llegas. Toma dos minutos: ya traemos tus datos de la
                Ruta.
              </p>
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-obsidiana px-4 py-2 text-sm text-oro">
                Calcular mi meta
                <ArrowRight size={15} />
              </span>
            </div>
          </>
        )}
      </Link>

      {/* ---- Mi Ruta de 90 Días ---- */}
      <Link
        href="/dashboard/ruta"
        className="surface surface-link animate-rise flex flex-col gap-5 p-7 lg:col-span-2"
        style={{ '--d': '140ms' } as React.CSSProperties}
      >
        <CellHeader icon={Route} title="Mi Ruta de 90 Días" />
        {route?.started ? (
          <div className="flex items-center gap-5">
            <ProgressRing
              value={(route.day / 90) * 100}
              size={92}
              stroke={8}
              label={`Día ${route.day} de 90`}
            >
              <span className="leading-none">
                <span className="block font-display text-2xl tabular-nums text-marfil">
                  {route.day}
                </span>
                <span className="text-[0.65rem] text-grafito-texto">de 90</span>
              </span>
            </ProgressRing>
            <div className="min-w-0">
              <p className="text-sm text-marfil">
                {routeDone}/{routeTotal} tareas hechas
              </p>
              {nextTask && (
                <p className="mt-2 line-clamp-3 text-sm leading-snug text-marfil/65">
                  <span className="text-grafito-texto">Siguiente: </span>
                  {nextTask.label}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-marfil/70">
            Cuéntanos tu punto de partida y te mostramos tu rango de compra y
            el plan en tres bloques de treinta días.
          </p>
        )}
      </Link>

      {/* ---- Check List ---- */}
      <Link
        href="/dashboard/checklist"
        className="surface surface-link animate-rise flex flex-col gap-5 p-7 lg:col-span-2"
        style={{ '--d': '200ms' } as React.CSSProperties}
      >
        <CellHeader icon={ClipboardCheck} title="Check List" />
        {projects && projects.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {projects.slice(0, 3).map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate text-marfil/85">
                  {project.projectName}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS_CHIP[project.status]}`}
                >
                  {project.score === null ? project.label : `${project.score}%`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-marfil/70">
            Antes de firmar, revisa el proyecto en 12 criterios. Lo que
            averigües queda guardado con tus observaciones.
          </p>
        )}
      </Link>

      {/* ---- Consultor Luifer ---- */}
      <section
        className="surface-azul animate-rise flex flex-col gap-5 p-7 lg:col-span-3"
        style={{ '--d': '260ms' } as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-marfil/70">
              Consultor Luifer
            </p>
            <h2 className="mt-3 font-display text-2xl leading-tight">
              Pregúntale con el método de Luifer
            </h2>
          </div>
          <MessagesSquare size={22} className="shrink-0 text-marfil/70" />
        </div>
        {lastConversation && (
          <p className="text-sm text-marfil/75">
            <span className="text-marfil/55">Tu última pregunta: </span>
            {lastConversation.title}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <Link
              key={suggestion}
              href="/dashboard/consultor"
              className="rounded-full border border-marfil/20 bg-marfil/[0.07] px-3.5 py-1.5 text-sm text-marfil/90 transition-colors hover:bg-marfil/15"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      </section>

      {/* ---- El método en orden ---- */}
      <section
        className="surface animate-rise flex flex-col gap-4 p-7 lg:col-span-3"
        style={{ '--d': '320ms' } as React.CSSProperties}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-grafito-texto">
          El método, en orden
        </p>
        <ol className="flex flex-col gap-1">
          {[
            { href: '/dashboard/ruta', label: 'Ordena tu punto de partida', done: Boolean(route?.started) },
            { href: '/dashboard/pension', label: 'Define tu meta de pensión', done: Boolean(pension?.saved) },
            { href: '/dashboard/checklist', label: 'Evalúa tu primer proyecto', done: Boolean(projects?.length) },
          ].map((step, index) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex items-center gap-4 rounded-xl px-2 py-2.5 transition-colors hover:bg-marfil/[0.04]"
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm tabular-nums ${
                    step.done
                      ? 'border-dorado bg-dorado text-obsidiana'
                      : 'border-marfil/15 text-marfil/70'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </span>
                <span
                  className={`flex-1 text-sm ${step.done ? 'text-marfil/50 line-through' : 'text-marfil'}`}
                >
                  {step.label}
                </span>
                <ArrowRight
                  size={15}
                  className="text-grafito-texto transition-colors group-hover:text-dorado"
                />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CellHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Route;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg border border-marfil/[0.08] bg-marfil/[0.04] text-dorado">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <h2 className="text-sm text-marfil">{title}</h2>
      </div>
      <ArrowUpRight size={17} className="text-grafito-texto" />
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof Route;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-full border border-marfil/10 bg-marfil/[0.04] px-4 py-2 text-sm text-marfil/85 transition-colors hover:border-dorado/40 hover:text-marfil"
    >
      <Icon size={15} className="text-dorado" />
      {children}
    </Link>
  );
}
