import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CATEGORIES, CRITERIA } from './criteria';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { runFilter, type FilterResult } from './filter.math';
import { evaluate, pricingChoice, type Evaluation } from './scoring';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';

export interface Assessment {
  evaluation: Evaluation;
  /** `null` si no hay comparables suficientes para calcularlo. */
  pricing: FilterResult | null;
}

@Injectable()
export class FilterService {
  constructor(
    @InjectModel(Analysis.name)
    private readonly model: Model<AnalysisDocument>,
    private readonly config: ConfigService,
  ) {}

  /** Los criterios y los valores por defecto que usa el formulario. */
  form() {
    return {
      categories: CATEGORIES,
      criteria: CRITERIA,
      defaults: {
        deedCostRate: this.config.getOrThrow<number>('filter.deedCostRate'),
        taxRate: this.config.getOrThrow<number>('filter.taxRate'),
        safetyMarginRate: this.config.getOrThrow<number>(
          'filter.safetyMarginRate',
        ),
        refurbishCost: 0,
      },
    };
  }

  /**
   * Evalúa sin guardar, para que el resultado se actualice al responder.
   *
   * El criterio del precio no se pregunta: sale de los comparables. Si no
   * hay suficientes, queda sin contestar y baja la confianza, igual que
   * cualquier otro hueco.
   */
  assess(dto: CreateAnalysisDto): Assessment {
    const pricing = this.price(dto);
    const answers = { ...dto.answers };

    if (pricing && dto.listedPrice) {
      answers.precio_m2 = pricingChoice(dto.listedPrice, pricing.marketValue);
    } else {
      delete answers.precio_m2;
    }

    return { evaluation: evaluate(answers), pricing };
  }

  private price(dto: CreateAnalysisDto): FilterResult | null {
    const comparables = dto.comparables ?? [];
    if (!dto.listedPrice || !dto.areaM2 || comparables.length < 2) return null;

    const fallback = this.form().defaults;
    return runFilter({
      listedPrice: dto.listedPrice,
      areaM2: dto.areaM2,
      comparables,
      deedCostRate: dto.deedCostRate ?? fallback.deedCostRate,
      taxRate: dto.taxRate ?? fallback.taxRate,
      refurbishCost: dto.refurbishCost ?? fallback.refurbishCost,
      safetyMarginRate: dto.safetyMarginRate ?? fallback.safetyMarginRate,
    });
  }

  async create(userId: string, dto: CreateAnalysisDto) {
    const assessment = this.assess(dto);

    const saved = await this.model.create({
      userId: new Types.ObjectId(userId),
      projectName: dto.projectName,
      location: dto.location,
      answers: dto.answers,
      listedPrice: dto.listedPrice ?? null,
      areaM2: dto.areaM2 ?? null,
      comparables: dto.comparables ?? [],
      pricing: assessment.pricing as unknown as Record<
        string,
        number | boolean
      > | null,
      result: assessment.evaluation as unknown as Record<string, unknown>,
      notes: dto.notes,
    });

    return this.sanitize(saved);
  }

  /**
   * Solo los propios. El filtro va por `userId` y no solo por `_id`: sin eso,
   * conocer un identificador bastaría para leer la evaluación de otra
   * persona.
   */
  async findAll(userId: string) {
    const rows = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    return rows.map((row) => this.sanitize(row));
  }

  async findOne(userId: string, id: string) {
    const row = await this.owned(userId, id);
    return this.sanitize(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.owned(userId, id);
    await this.model.deleteOne({ _id: id }).exec();
  }

  private async owned(userId: string, id: string): Promise<AnalysisDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No encontramos esa evaluación.');
    }
    const row = await this.model
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!row) throw new NotFoundException('No encontramos esa evaluación.');
    return row;
  }

  private sanitize(row: AnalysisDocument) {
    return {
      id: row.id,
      projectName: row.projectName,
      location: row.location ?? null,
      answers: row.answers ?? {},
      listedPrice: row.listedPrice,
      areaM2: row.areaM2,
      comparables: row.comparables.map((c) => ({
        reference: c.reference,
        areaM2: c.areaM2,
        price: c.price,
      })),
      pricing: row.pricing as unknown as FilterResult | null,
      result: row.result as unknown as Evaluation,
      notes: row.notes ?? null,
      createdAt: (row as unknown as { createdAt: Date }).createdAt,
    };
  }
}
