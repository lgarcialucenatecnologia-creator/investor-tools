import { IsEmail, IsString, MinLength } from 'class-validator';

export class SetInitialPasswordDto {
  @IsEmail({}, { message: 'Revisa el correo, no parece válido.' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'La contraseña necesita al menos 8 caracteres.',
  })
  password: string;
}
