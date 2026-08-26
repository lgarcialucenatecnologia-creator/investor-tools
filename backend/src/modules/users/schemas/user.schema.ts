import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  /** Cliente de la plataforma. */
  INVESTOR = 'investor',
  /** Luifer y su equipo. */
  ADVISOR = 'advisor',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  /** Nunca se devuelve al cliente: `select: false`. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  /** Hash del refresh token vigente. `null` = sesión cerrada. */
  @Prop({ type: String, default: null, select: false })
  refreshTokenHash: string | null;

  /** Teléfono en formato E.164, usado por el módulo Consultor Luifer. */
  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.INVESTOR })
  role: UserRole;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
