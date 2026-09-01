import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope de cordura: mil millones de millones es un error de dedo, no un dato. */
const TOPE = 1_000_000_000_000;

export class StartingPointDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  propertyType?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El dinero disponible debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  availableCash: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'La reserva debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  safetyReserve: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El ingreso mensual debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  monthlyIncome: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Las obligaciones deben ser un número.' })
  @Min(0)
  @Max(TOPE)
  monthlyObligations: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El crédito debe ser un número.' })
  @Min(0)
  @Max(TOPE)
  possibleCredit: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mainDifficulty?: string;
}
