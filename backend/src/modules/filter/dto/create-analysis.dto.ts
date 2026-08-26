import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
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

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio publicado debe ser un número.' })
  @IsPositive({ message: 'El precio publicado tiene que ser mayor que cero.' })
  listedPrice: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El área debe ser un número.' })
  @IsPositive({ message: 'El área tiene que ser mayor que cero.' })
  @Max(100_000)
  areaM2: number;

  /**
   * Al menos dos: con uno solo no hay mediana que valga, es la opinión de un
   * único vecino. El tope evita cargas absurdas.
   */
  @IsArray()
  @ArrayMinSize(2, {
    message: 'Necesitas al menos dos comparables para tener una referencia.',
  })
  @ArrayMaxSize(20, { message: 'Máximo 20 comparables.' })
  @ValidateNested({ each: true })
  @Type(() => ComparableDto)
  comparables: ComparableDto[];

  // Los porcentajes van entre 0 y 0.5: por encima de la mitad del valor no
  // es un costo, es un error de dedo al escribir «20» en vez de «0,20».
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
