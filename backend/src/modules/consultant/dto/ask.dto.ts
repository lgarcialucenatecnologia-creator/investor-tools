import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AskDto {
  @IsString()
  @MinLength(2, { message: 'Escribe tu pregunta.' })
  @MaxLength(4000, {
    message: 'La pregunta es muy larga. Divídela en dos.',
  })
  question: string;

  /** Sin esto se abre una conversación nueva. */
  @IsOptional()
  @IsMongoId({ message: 'La conversación no es válida.' })
  conversationId?: string;
}
