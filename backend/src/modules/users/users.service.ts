import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    phone?: string;
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /** Incluye `passwordHash`, excluido por defecto del esquema. */
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  /** Incluye `sessions`, excluidas por defecto del esquema. */
  findByIdWithSessions(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return this.userModel.findById(id).select('+sessions').exec();
  }

  /**
   * Abre una sesión nueva y descarta la más antigua si ya se llegó al tope.
   * El recorte se hace en el mismo `$push` con `$slice` negativo, que en
   * Mongo conserva los últimos N elementos del arreglo.
   */
  async openSession(
    userId: string,
    session: Session,
    maxPerUser: number,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $push: {
            sessions: { $each: [session], $slice: -Math.max(1, maxPerUser) },
          },
        },
      )
      .exec();
  }

  /**
   * Rota el refresh de una sesión concreta. El hash saliente queda como
   * `previousHash` hasta `previousValidUntil`: esa es la ventana de gracia
   * que permite que dos pestañas refresquen a la vez sin expulsarse.
   */
  async rotateSession(
    userId: string,
    sid: Types.ObjectId,
    tokenHash: string,
    previousHash: string,
    previousValidUntil: Date,
  ): Promise<void> {
    await this.userModel
      .updateOne(
        { _id: userId, 'sessions.sid': sid },
        {
          $set: {
            'sessions.$.tokenHash': tokenHash,
            'sessions.$.previousHash': previousHash,
            'sessions.$.previousValidUntil': previousValidUntil,
            'sessions.$.lastUsedAt': new Date(),
          },
        },
      )
      .exec();
  }

  /** Cierra una sesión concreta: el resto de dispositivos siguen dentro. */
  async closeSession(userId: string, sid: Types.ObjectId): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $pull: { sessions: { sid } } })
      .exec();
  }

  /** Cierra todas. Se usa ante una reutilización de token confirmada. */
  async closeAllSessions(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { $set: { sessions: [] } })
      .exec();
  }
}
