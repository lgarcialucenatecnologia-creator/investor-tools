import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

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

  /** Incluye `refreshTokenHash`, excluido por defecto del esquema. */
  findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  setRefreshTokenHash(id: string, hash: string | null): Promise<unknown> {
    return this.userModel
      .updateOne({ _id: id }, { refreshTokenHash: hash })
      .exec();
  }
}
