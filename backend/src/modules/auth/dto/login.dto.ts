import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Revisa el correo, no parece válido.' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
