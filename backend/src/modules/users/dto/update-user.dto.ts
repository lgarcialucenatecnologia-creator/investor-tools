import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole, UserStatus } from '../schemas/user.schema';

/**
 * El correo no se puede cambiar: es la llave con la que el usuario entra y
 * con la que se creó la cuenta tras la compra. Si está mal, se borra y se
 * crea de nuevo.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message:
      'El teléfono va en formato internacional, por ejemplo +573001234567.',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Ese rol no existe.' })
  role?: UserRole;

  /** Solo se puede pausar o reanudar; «pendiente» lo fija la reactivación. */
  @IsOptional()
  @IsEnum([UserStatus.ACTIVE, UserStatus.SUSPENDED], {
    message: 'Solo se puede activar o pausar el acceso.',
  })
  status?: UserStatus.ACTIVE | UserStatus.SUSPENDED;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate({ message: 'La fecha de vencimiento no es válida.' })
  accessExpiresAt?: Date | null;
}
