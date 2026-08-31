import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum Author {
  PERSON = 'person',
  CONSULTANT = 'consultant',
}

@Schema({ _id: false })
export class Message {
  @Prop({ type: String, enum: Object.values(Author), required: true })
  author: Author;

  @Prop({ required: true })
  text: string;

  /**
   * Con qué versión del material se respondió. Sin esto no se puede explicar
   * una respuesta vieja: el método pudo cambiar dos veces desde entonces.
   */
  @Prop({ type: Number, default: null })
  knowledgeVersion: number | null;

  /** Si el guarda de datos obsoletos cortó la respuesta, y por qué. */
  @Prop({ type: [String], default: [] })
  blockedFor: string[];

  @Prop({ type: Date, required: true })
  at: Date;
}
export const MessageSchema = SchemaFactory.createForClass(Message);

/**
 * Una conversación con el Consultor.
 *
 * Se guarda entera, y no solo por comodidad de quien pregunta: lo que la
 * gente pregunta le dice a Luifer qué no está explicando bien. Eso es
 * material para su contenido y sale gratis.
 */
@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  /** Se arma con la primera pregunta, para poder reconocerla en la lista. */
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];

  @Prop({ type: Date, required: true })
  lastMessageAt: Date;
}

export type ConversationDocument = HydratedDocument<Conversation>;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
