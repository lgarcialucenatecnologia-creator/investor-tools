import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { runFilter, type FilterInput, type FilterResult } from './filter.math';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';

@Injectable()
export class FilterService {
  constructor(
    @InjectModel(Analysis.name)
    private readonly model: Model<AnalysisDocument>,
    private readonly config: ConfigService,
  ) {}

  /** Los que trae puestos el formulario cuando el usuario no los toca. */
  defaults() {
    return {
      deedCostRate: this.config.getOrThrow<number>('filter.deedCostRate'),
      taxRate: this.config.getOrThrow<number>('filter.taxRate'),
      safetyMarginRate: this.config.getOrThrow<number>(
        'filter.safetyMarginRate',
      ),
      refurbishCost: 0,
    };
  }

  /**
   * Arma la entrada del cálculo. Se construye campo por campo y no
   * esparciendo el DTO encima de los valores por defecto: así un cero
   * enviado a propósito —«no hay adecuaciones»— se respeta, mientras que un
   * campo ausente toma el valor por defecto. Esparcir no distingue los dos.
   */
  private toInput(dto: CreateAnalysisDto): FilterInput {
    const fallback = this.defaults();
    return {
      listedPrice: dto.listedPrice,
      areaM2: dto.areaM2,
      comparables: dto.comparables,
      deedCostRate: dto.deedCostRate ?? fallback.deedCostRate,
      taxRate: dto.taxRate ?? fallback.taxRate,
      refurbishCost: dto.refurbishCost ?? fallback.refurbishCost,
      safetyMarginRate: dto.safetyMarginRate ?? fallback.safetyMarginRate,
    };
  }

  /** Calcula sin guardar: para que el resultado se actualice al escribir. */
  preview(dto: CreateAnalysisDto): FilterResult {
    return runFilter(this.toInput(dto));
  }

  async create(userId: string, dto: CreateAnalysisDto) {
    const input = this.toInput(dto);
    const result = runFilter(input);

    const saved = await this.model.create({
      userId: new Types.ObjectId(userId),
      projectName: dto.projectName,
      location: dto.location,
      listedPrice: dto.listedPrice,
      areaM2: dto.areaM2,
      comparables: dto.comparables,
      deedCostRate: input.deedCostRate,
      taxRate: input.taxRate,
      refurbishCost: input.refurbishCost,
      safetyMarginRate: input.safetyMarginRate,
      result: result as unknown as Record<string, number | boolean>,
      notes: dto.notes,
    });

    return this.sanitize(saved);
  }

  /**
   * Solo los propios. El filtro va por `userId` y no solo por `_id`: sin eso,
   * conocer un identificador bastaría para leer el análisis de otra persona.
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
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No encontramos ese análisis.');
    }
    const row = await this.model
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!row) throw new NotFoundException('No encontramos ese análisis.');
    return this.sanitize(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No encontramos ese análisis.');
    }
    const deleted = await this.model
      .findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (!deleted) throw new NotFoundException('No encontramos ese análisis.');
  }

  private sanitize(row: AnalysisDocument) {
    return {
      id: row.id,
      projectName: row.projectName,
      location: row.location ?? null,
      listedPrice: row.listedPrice,
      areaM2: row.areaM2,
      comparables: row.comparables.map((c) => ({
        reference: c.reference,
        areaM2: c.areaM2,
        price: c.price,
      })),
      deedCostRate: row.deedCostRate,
      taxRate: row.taxRate,
      refurbishCost: row.refurbishCost,
      safetyMarginRate: row.safetyMarginRate,
      result: row.result as unknown as FilterResult,
      notes: row.notes ?? null,
      createdAt: (row as unknown as { createdAt: Date }).createdAt,
    };
  }
}
