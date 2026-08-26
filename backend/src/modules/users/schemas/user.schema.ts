import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum UserRole {
  /** Cliente de la plataforma. */
  INVESTOR = 'investor',
  /** Luifer y su equipo. */
  ADVISOR = 'advisor',
  ADMIN = 'admin',
}

/**
 * Una sesión por dispositivo.
 *
 * Antes había un único `refreshTokenHash` por usuario, lo que producía dos
 * fallos que el cliente lee como producto inestable: entrar en el celular
 * cerraba la sesión del computador, y dos pestañas refrescando a la vez se
 * expulsaban mutuamente. Cada sesión guarda además el hash inmediatamente
 * anterior con su fecha de caducidad, que es la ventana de gracia.
 */
@Schema({ _id: false })
export class Session {
  /** Identificador de la sesión. Viaja dentro del token como `sid`. */
  @Prop({ type: Types.ObjectId, required: true })
  sid: Types.ObjectId;

  /** SHA-256 del refresh vigente. */
  @Prop({ required: true })
  tokenHash: string;

  /** El hash justo anterior, aceptado hasta `previousValidUntil`. */
  @Prop({ type: String, default: null })
  previousHash: string | null;

  @Prop({ type: Date, default: null })
  previousValidUntil: Date | null;

  /** Para poder mostrarle al usuario dónde tiene sesiones abiertas. */
  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  lastUsedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  /** Nunca se devuelve al cliente: `select: false`. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  /** Sesiones abiertas. Excluidas por defecto. */
  @Prop({ type: [SessionSchema], default: [], select: false })
  sessions: Session[];

  /** Teléfono en formato E.164, usado por el módulo Consultor Luifer. */
  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.INVESTOR })
  role: UserRole;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
