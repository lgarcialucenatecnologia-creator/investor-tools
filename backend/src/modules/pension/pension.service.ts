import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RouteService } from '../route/route.service';
import { PensionInputDto } from './dto/pension-input.dto';
import {
  calculatePension,
  type PensionInput,
  type PensionResult,
} from './pension.math';
import {
  PensionPlan,
  PensionPlanDocument,
} from './schemas/pension-plan.schema';

export interface PensionOverview {
  /** Ya guardó su número alguna vez. */
  saved: boolean;
  /** Lo guardado, o un punto de partida armado con Mi Ruta. */
  input: PensionInput;
  /** El formulario trae datos de Mi Ruta que la persona no escribió aquí. */
  prefilledFromRoute: boolean;
  result: PensionResult | null;
  defaultReturnRate: number;
  updatedAt: Date | null;
}

@Injectable()
export class PensionService {
  constructor(
    @InjectModel(PensionPlan.name)
    private readonly model: Model<PensionPlanDocument>,
    private readonly routes: RouteService,
    private readonly config: ConfigService,
  ) {}

  private get defaultReturnRate() {
    return this.config.getOrThrow<number>('pension.defaultReturnRate');
  }

  calculate(dto: PensionInputDto): PensionResult {
    return calculatePension(this.toInput(dto));
  }

  async overview(userId: string): Promise<PensionOverview> {
    const plan = await this.model
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (plan) {
      const input = plan.input as unknown as PensionInput;
      const { updatedAt } = plan as unknown as { updatedAt: Date };
      return {
        saved: true,
        input,
        prefilledFromRoute: false,
        result: calculatePension(input),
        defaultReturnRate: this.defaultReturnRate,
        updatedAt,
      };
    }

    return { ...(await this.prefill(userId)), updatedAt: null };
  }

  async save(userId: string, dto: PensionInputDto) {
    const input = this.toInput(dto);
    await this.model
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        { $set: { input } },
        { upsert: true },
      )
      .exec();
    return this.overview(userId);
  }

  /**
   * Sin cálculo guardado, se arranca con lo que ya contó en Mi Ruta: no se
   * le vuelve a preguntar lo que ya dijo. Del dinero disponible se descuenta
   * la reserva de seguridad, igual que en la Ruta: lo que no se toca no es
   * capital para invertir.
   */
  private async prefill(userId: string) {
    const start = await this.routes.startingPointOf(userId);
    const investable = start
      ? Math.max(0, start.availableCash - start.safetyReserve)
      : 0;

    const input: PensionInput = {
      monthlyIncome: start?.monthlyIncome ?? 0,
      additionalIncome: 0,
      monthlyExpenses: start?.monthlyObligations ?? 0,
      expenseReduction: 0,
      goal: 'gastos',
      annualReturnRate: this.defaultReturnRate,
      events:
        investable > 0
          ? [
              {
                label: 'Dinero disponible (sin tu reserva)',
                amount: investable,
                month: 0,
              },
            ]
          : [],
    };

    return {
      saved: false,
      input,
      prefilledFromRoute: Boolean(start),
      result: null,
      defaultReturnRate: this.defaultReturnRate,
    };
  }

  private toInput(dto: PensionInputDto): PensionInput {
    return {
      monthlyIncome: dto.monthlyIncome,
      additionalIncome: dto.additionalIncome,
      monthlyExpenses: dto.monthlyExpenses,
      expenseReduction: dto.expenseReduction,
      goal: dto.goal,
      annualReturnRate: dto.annualReturnRate,
      events: dto.events
        .filter((event) => event.amount !== 0)
        .map((event) => ({
          label: event.label.trim(),
          amount: event.amount,
          month: event.month,
        })),
    };
  }
}
