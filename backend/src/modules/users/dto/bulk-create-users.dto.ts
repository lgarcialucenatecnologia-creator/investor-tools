import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class BulkCreateUsersDto {
  /**
   * El tope no es capricho: cada alta escribe en Mongo y valida un correo,
   * y una carga sin límite bloquearía el proceso para todos los demás.
   */
  @IsArray()
  @ArrayMinSize(1, { message: 'El archivo no trae ninguna fila válida.' })
  @ArrayMaxSize(500, {
    message: 'Máximo 500 cuentas por carga. Divide el archivo.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}
