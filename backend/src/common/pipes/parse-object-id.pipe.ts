import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Un id con forma inválida debe ser un 400 claro, no una excepción de
 * casteo de Mongoose convertida en 500.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('El identificador no es válido.');
    }
    return value;
  }
}
