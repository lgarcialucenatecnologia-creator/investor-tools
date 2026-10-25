import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { ProjectType } from '../checklist.criteria';

/**
 * Lo mínimo para calcular el resultado sin guardar.
 *
 * Calificaciones y observaciones se validan contra el registro de ítems en el
 * servicio, no aquí: la lista cambia con el método y este DTO no tendría por
 * qué enterarse cada vez.
 */
export class AssessChecklistDto {
  @IsIn(['vis', 'no_vis'], { message: 'El tipo debe ser VIS o NO VIS.' })
  projectType: ProjectType;

  @IsObject()
  ratings: Record<string, number>;
}

export class SaveChecklistDto extends AssessChecklistDto {
  @IsString()
  @MinLength(2, { message: 'Ponle un nombre al proyecto.' })
  @MaxLength(140)
  projectName: string;

  @IsOptional()
  @IsObject()
  notes?: Record<string, string>;
}
