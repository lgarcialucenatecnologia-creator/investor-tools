import { IsEmail } from 'class-validator';

export class CheckNewUserDto {
  @IsEmail({}, { message: 'Revisa el correo, no parece válido.' })
  email: string;
}
