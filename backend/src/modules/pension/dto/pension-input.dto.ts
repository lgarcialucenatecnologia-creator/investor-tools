import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_MONTHS, type PensionGoal } from '../pension.math';

/** Tope de cordura: mil millones de millones es un error de dedo, no un dato. */
const TOPE = 1_000_000_000_000;

export class CashEventDto {
  @IsString()
  @MinLength(1, { message: 'Ponle un nombre al activo.' })
  @MaxLength(80)
  label: string;

  /** Positivo si entra al capital, negativo si sale. */
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número.' })
  @Min(-TOPE)
  @Max(TOPE)
  amount: number;

  @Type(() => Number)
  @IsInt({ message: 'El mes debe ser un número entero.' })
  @Min(0)
  @Max(MAX_MONTHS, { message: 'El mes no puede pasar de 600 (50 años).' })
  month: number;
}

export class PensionInputDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El ingreso mensual debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  monthlyIncome: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El ingreso adicional debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  additionalIncome: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Los gastos mensuales deben ser un número.' })
  @Min(0)
  @Max(TOPE)
  monthlyExpenses: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'La reducción de gastos debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  expenseReduction: number;

  @IsIn(['gastos', 'ingreso'])
  goal: PensionGoal;

  /** Anual, neta y real. Entre 1% y 20%: fuera de eso no es un supuesto serio. */
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'La rentabilidad debe ser de al menos 1%.' })
  @Max(0.2, {
    message: 'Una rentabilidad real de más de 20% no es un supuesto prudente.',
  })
  annualReturnRate: number;

  @IsArray()
  @ArrayMaxSize(20, { message: 'Máximo 20 activos o movimientos.' })
  @ValidateNested({ each: true })
  @Type(() => CashEventDto)
  events: CashEventDto[];
}
