import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'El nombre necesita al menos 3 caracteres.' })
  @MaxLength(120)
  fullName: string;

  /** El mismo con el que compró: es la llave que va a usar para entrar. */
  @IsEmail({}, { message: 'Revisa el correo, no parece válido.' })
  email: string;

  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message:
      'El teléfono va en formato internacional, por ejemplo +573001234567.',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Ese rol no existe.' })
  role?: UserRole;

  /** Vigencia del acceso. Sin fecha, no vence. */
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de vencimiento no es válida.' })
  accessExpiresAt?: Date;
}
