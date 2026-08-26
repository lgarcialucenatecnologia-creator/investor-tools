import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Escribe tu nombre completo.' })
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Revisa el correo, no parece válido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres.' })
  password: string;

  @IsOptional()
  @IsPhoneNumber(undefined, {
    message:
      'Usa el teléfono en formato internacional, por ejemplo +573001234567.',
  })
  phone?: string;
}
