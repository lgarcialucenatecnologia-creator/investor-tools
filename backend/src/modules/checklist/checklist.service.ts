import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITEMS, MAX_NOTE_LENGTH, SECTIONS } from './checklist.criteria';
import {
  evaluate,
  validRating,
  type ChecklistEvaluation,
} from './checklist.scoring';
import { AssessChecklistDto, SaveChecklistDto } from './dto/save-checklist.dto';
import { Checklist, ChecklistDocument } from './schemas/checklist.schema';

const KNOWN_ITEMS = new Set(ITEMS.map((item) => item.id));

/** Un proyecto completo, tal como lo devuelve el servicio. */
export type SavedChecklist =
  ReturnType<ChecklistService['findOne']> extends Promise<infer T> ? T : never;

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(Checklist.name)
    private readonly model: Model<ChecklistDocument>,
  ) {}

  /** Las secciones, ítems y guías: la pantalla se dibuja a partir de esto. */
  form() {
    return { sections: SECTIONS };
  }

  /** Calcula sin guardar, para que el resultado se vea mientras se califica. */
  assess(dto: AssessChecklistDto): ChecklistEvaluation {
    return evaluate(dto.projectType, this.cleanRatings(dto.ratings));
  }

  async create(userId: string, dto: SaveChecklistDto) {
    const saved = await this.model.create({
      userId: new Types.ObjectId(userId),
      ...this.toDocument(dto),
    });
    return this.sanitize(saved);
  }

  async update(userId: string, id: string, dto: SaveChecklistDto) {
    const row = await this.owned(userId, id);
    row.set(this.toDocument(dto));
    await row.save();
    return this.sanitize(row);
  }

  /**
   * Solo los propios, del más reciente al más viejo. Va por `userId` y no
   * solo por `_id`: conocer un identificador no debe bastar para leer el
   * proyecto de otra persona.
   */
  async findAll(userId: string) {
    const rows = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(100)
      .exec();
    return rows.map((row) => this.summarize(row));
  }

  /**
   * Los más recientes, completos. Lo usan Mi Ruta (como evidencia de avance)
   * y el Consultor (como contexto de lo que la persona ya evaluó).
   */
  async findRecent(userId: string, limit = 20) {
    const rows = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
    return rows.map((row) => this.sanitize(row));
  }

  async findOne(userId: string, id: string) {
    return this.sanitize(await this.owned(userId, id));
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.owned(userId, id);
    await this.model.deleteOne({ _id: id }).exec();
  }

  private toDocument(dto: SaveChecklistDto) {
    const ratings = this.cleanRatings(dto.ratings);
    return {
      projectName: dto.projectName.trim(),
      projectType: dto.projectType,
      ratings,
      notes: this.cleanNotes(dto.notes),
      result: evaluate(dto.projectType, ratings) as unknown as Record<
        string,
        unknown
      >,
    };
  }

  /** Solo ítems que existen y calificaciones enteras de 1 a 5. */
  private cleanRatings(raw: Record<string, unknown> = {}) {
    const clean: Record<string, number> = {};
    for (const [itemId, value] of Object.entries(raw)) {
      if (KNOWN_ITEMS.has(itemId) && validRating(value)) clean[itemId] = value;
    }
    return clean;
  }

  /** Solo ítems que existen, texto recortado y sin observaciones vacías. */
  private cleanNotes(raw: Record<string, unknown> = {}) {
    const clean: Record<string, string> = {};
    for (const [itemId, value] of Object.entries(raw)) {
      if (!KNOWN_ITEMS.has(itemId) || typeof value !== 'string') continue;
      const text = value.trim().slice(0, MAX_NOTE_LENGTH);
      if (text) clean[itemId] = text;
    }
    return clean;
  }

  private async owned(userId: string, id: string): Promise<ChecklistDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No encontramos ese proyecto.');
    }
    const row = await this.model
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!row) throw new NotFoundException('No encontramos ese proyecto.');
    return row;
  }

  private timestamps(row: ChecklistDocument) {
    const { createdAt, updatedAt } = row as unknown as {
      createdAt: Date;
      updatedAt: Date;
    };
    return { createdAt, updatedAt };
  }

  /** Lo que lista el selector de proyectos: sin calificaciones ni notas. */
  private summarize(row: ChecklistDocument) {
    const result = row.result as unknown as ChecklistEvaluation;
    return {
      id: row.id,
      projectName: row.projectName,
      projectType: row.projectType,
      score: result.score,
      status: result.status,
      label: result.label,
      evaluated: result.evaluated,
      total: result.total,
      ...this.timestamps(row),
    };
  }

  private sanitize(row: ChecklistDocument) {
    return {
      id: row.id,
      projectName: row.projectName,
      projectType: row.projectType,
      ratings: row.ratings ?? {},
      notes: row.notes ?? {},
      result: row.result as unknown as ChecklistEvaluation,
      ...this.timestamps(row),
    };
  }
}
