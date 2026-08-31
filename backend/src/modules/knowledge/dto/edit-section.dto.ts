import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class EditSectionDto {
  @Type(() => Number)
  @IsInt({ message: 'La sección no es válida.' })
  @Min(0)
  order: number;

  /**
   * El tope es generoso pero existe: una sección de medio megabyte es un
   * error de pegado, no una corrección.
   */
  @IsString()
  @MaxLength(200_000, { message: 'El texto de la sección es demasiado largo.' })
  body: string;
}
