import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ComparableDto {
  @IsString()
  @MinLength(2, { message: 'Ponle una referencia al comparable.' })
  @MaxLength(120)
  reference: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El área debe ser un número.' })
  @IsPositive({ message: 'El área tiene que ser mayor que cero.' })
  @Max(100_000)
  areaM2: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @IsPositive({ message: 'El precio tiene que ser mayor que cero.' })
  price: number;
}

export class CreateAnalysisDto {
  @IsString()
  @MinLength(2, { message: 'Ponle un nombre al proyecto.' })
  @MaxLength(140)
  projectName: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  location?: string;

  /**
   * Respuesta por criterio. Se valida contra el registro en el servicio, no
   * aquí: la lista de criterios cambia con el método y este DTO no tendría
   * por qué enterarse cada vez.
   */
  @IsObject()
  answers: Record<string, string>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  listedPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(100_000)
  areaM2?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'Máximo 20 comparables.' })
  @ValidateNested({ each: true })
  @Type(() => ComparableDto)
  comparables?: ComparableDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.5)
  deedCostRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.5)
  taxRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  refurbishCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.5)
  safetyMarginRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
