import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChecklistService,
  type SavedChecklist,
} from '../checklist/checklist.service';
import { StartingPointDto } from './dto/starting-point.dto';
import { buildRange, type BuyingRange } from './route.math';
import { BLOCKS, findTask, type Evidence } from './route.plan';
import { Route, RouteDocument } from './schemas/route.schema';

export interface TaskState {
  id: string;
  label: string;
  why: string;
  done: boolean;
  /** Cómo se dio por hecha: a mano, o con trabajo demostrado. */
  source: 'manual' | 'demostrada' | null;
  /** Si se demuestra sola, se dice — para que nadie la marque a mano en vano. */
  provenBy: Evidence | null;
}

export interface BlockState {
  id: string;
  order: number;
  fromDay: number;
  toDay: number;
  stages: string;
  goal: string;
  caveat: string;
  tasks: TaskState[];
  done: number;
  total: number;
  /** El bloque donde está hoy, por días transcurridos. */
  current: boolean;
}

@Injectable()
export class RouteService {
  constructor(
    @InjectModel(Route.name) private readonly model: Model<RouteDocument>,
    private readonly checklists: ChecklistService,
  ) {}

  async saveStartingPoint(userId: string, dto: StartingPointDto) {
    if (dto.safetyReserve > dto.availableCash) {
      throw new BadRequestException(
        'La reserva no puede ser mayor que el dinero disponible.',
      );
    }

    const route =
      (await this.byUser(userId)) ??
      new this.model({ userId: new Types.ObjectId(userId), marks: [] });

    route.startingPoint = { ...dto };
    // El día uno se fija UNA vez. Volver a editar el diagnóstico no reinicia
    // los 90 días: si no, cualquier corrección borraría el avance real.
    route.startedAt ??= new Date();
    await route.save();

    return this.overview(userId);
  }

  /** Marca o desmarca una tarea de las que se llevan a mano. */
  async toggleTask(userId: string, taskId: string) {
    const task = findTask(taskId);
    if (!task) throw new NotFoundException('Esa tarea no existe en la ruta.');
    if (task.evidence) {
      throw new BadRequestException(
        'Esa tarea se marca sola cuando el trabajo esté hecho. No se puede dar por cumplida a mano.',
      );
    }

    const route = await this.byUser(userId);
    if (!route?.startingPoint) {
      throw new BadRequestException(
        'Primero completa tu Punto de Partida para poder arrancar la ruta.',
      );
    }

    const index = route.marks.findIndex((mark) => mark.taskId === taskId);
    if (index >= 0) route.marks.splice(index, 1);
    else route.marks.push({ taskId, at: new Date() });

    route.markModified('marks');
    await route.save();

    return this.overview(userId);
  }

  async overview(userId: string) {
    const route = await this.byUser(userId);

    if (!route?.startingPoint) {
      return {
        started: false as const,
        day: 0,
        range: null,
        blocks: this.blockStates(new Set(), new Set(), 0),
        startingPoint: null,
      };
    }

    const range = buildRange(route.startingPoint);
    const day = this.dayOf(route.startedAt!);
    const manual = new Set(route.marks.map((mark) => mark.taskId));
    const proven = await this.provenEvidence(userId, range);

    return {
      started: true as const,
      startedAt: route.startedAt,
      day,
      range,
      startingPoint: { ...route.startingPoint },
      blocks: this.blockStates(manual, proven, day),
    };
  }

  /**
   * Qué está demostrado con trabajo real, no con una casilla.
   *
   * Se recalcula en cada consulta a propósito: si alguien borra la evaluación
   * que sostenía una tarea, el avance debe caerse. Un progreso que solo sube
   * no mide nada.
   */
  private async provenEvidence(
    userId: string,
    range: BuyingRange,
  ): Promise<Set<Evidence>> {
    const proven = new Set<Evidence>(['punto-de-partida']);

    if (!range.alerts.some((alert) => alert.severity === 'critica')) {
      proven.add('rango-limpio');
    }

    const projects = await this.checklists
      .findRecent(userId, 100)
      .catch((): SavedChecklist[] => []);
    if (projects.length > 0) proven.add('checklist-alguno');

    for (const project of projects) {
      if (project.ratings.precio_m2_zona !== undefined) {
        proven.add('checklist-mercado');
      }
      // Sólido, débil o «no pasa» es una decisión tomada. «Revisa antes de
      // avanzar» e «incompleto» no: ahí el expediente sigue abierto.
      if (['solido', 'debil', 'no_pasa'].includes(project.result.status)) {
        proven.add('checklist-decidido');
      }
    }

    return proven;
  }

  private blockStates(
    manual: Set<string>,
    proven: Set<Evidence>,
    day: number,
  ): BlockState[] {
    return BLOCKS.map((block) => {
      const tasks: TaskState[] = block.tasks.map((task) => {
        const demostrada = Boolean(task.evidence && proven.has(task.evidence));
        const aMano = !task.evidence && manual.has(task.id);
        return {
          id: task.id,
          label: task.label,
          why: task.why,
          done: demostrada || aMano,
          source: demostrada ? 'demostrada' : aMano ? 'manual' : null,
          provenBy: task.evidence ?? null,
        };
      });

      return {
        id: block.id,
        order: block.order,
        fromDay: block.fromDay,
        toDay: block.toDay,
        stages: block.stages,
        goal: block.goal,
        caveat: block.caveat,
        tasks,
        done: tasks.filter((task) => task.done).length,
        total: tasks.length,
        // Antes de arrancar, el bloque en curso es el primero. Pasados los 90
        // días se queda en el último: la ruta no expira, solo se acaba el
        // calendario sugerido.
        current:
          day === 0
            ? block.order === 0
            : day >= block.fromDay && day <= block.toDay,
      };
    }).map((block, index, all) =>
      // Si ningún bloque quedó en curso —día 91 o más—, manda el último.
      all.some((item) => item.current)
        ? block
        : { ...block, current: index === all.length - 1 },
    );
  }

  /** Día 1 es el primer día, no el cero. */
  private dayOf(startedAt: Date): number {
    const days = Math.floor((Date.now() - startedAt.getTime()) / 86_400_000);
    return Math.max(1, days + 1);
  }

  /**
   * Solo el punto de partida, sin calcular nada. Lo usa Mi Meta de Pensión
   * para no volver a preguntar ingresos y obligaciones que ya están aquí.
   */
  async startingPointOf(userId: string) {
    const route = await this.byUser(userId);
    return route?.startingPoint ?? null;
  }

  private byUser(userId: string): Promise<RouteDocument | null> {
    return this.model.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }
}
