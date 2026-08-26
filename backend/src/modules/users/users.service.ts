import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Session, User, UserDocument, UserStatus } from './schemas/user.schema';
import { UNUSABLE_PASSWORD_HASH } from './password.util';

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

  /**
   * La única forma en que un usuario sale del backend. Deja fuera
   * `passwordHash` y `sessions` por construcción, en vez de confiar en que
   * cada consulta se acuerde de excluirlos.
   */
  sanitize(user: UserDocument) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      status: user.status,
      accessExpiresAt: user.accessExpiresAt,
      activationExpiresAt: user.activationExpiresAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: (user as unknown as { createdAt: Date }).createdAt,
    };
  }

  /** Listado paginado del panel de administración. */
  async findAll(query: FindUsersQueryDto) {
    // Mongoose 9 renombró `FilterQuery` a `QueryFilter`.
    const filter: QueryFilter<User> = {};
    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
    if (query.search?.trim()) {
      // Se escapa la entrada: sin esto, un usuario podría enviar una
      // expresión regular capaz de agotar la CPU del servidor.
      const safe = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { fullName: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((u) => this.sanitize(u)),
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async stats() {
    const rows = await this.userModel.aggregate<{ _id: string; n: number }>([
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]);
    const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.n]));
    return {
      total: rows.reduce((sum, r) => sum + r.n, 0),
      active: byStatus.active ?? 0,
      pending: byStatus.pending_activation ?? 0,
      suspended: byStatus.suspended ?? 0,
    };
  }

  update(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
  }

  remove(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  /**
   * Devuelve la cuenta al estado «pendiente»: sirve tanto para quien perdió
   * la contraseña como para quien dejó vencer el plazo de activación. Se le
   * cierran todas las sesiones, porque quien tenga una abierta ya no debería
   * seguir dentro mientras se rehace la clave.
   */
  reopenActivation(
    id: string,
    activationTtlHours: number,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            passwordHash: UNUSABLE_PASSWORD_HASH,
            status: UserStatus.PENDING_ACTIVATION,
            activationExpiresAt: new Date(
              Date.now() + activationTtlHours * 3_600_000,
            ),
            sessions: [],
            tokensValidAfter: new Date(),
            activatedAt: null,
            activatedFromIp: null,
          },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * Cuántos administradores quedarían utilizables si se excluye a uno. Es la
   * comprobación que impide que el sistema se quede sin nadie que pueda
   * administrar.
   */
  countOtherUsableAdmins(excludeId: string): Promise<number> {
    return this.userModel
      .countDocuments({
        _id: { $ne: excludeId },
        role: UserRole.ADMIN,
        status: { $ne: UserStatus.SUSPENDED },
      })
      .exec();
  }

  /**
   * Alta desde la administración: la cuenta existe pero todavía no tiene
   * contraseña. No se guarda cadena vacía sino un hash imposible, para que
   * responda en el mismo tiempo que cualquier otra.
   */
  createPending(
    dto: CreateUserDto,
    options: { activationTtlHours: number; defaultAccessMonths: number },
  ): Promise<UserDocument> {
    return this.userModel.create(this.pendingDocument(dto, options));
  }

  /**
   * Alta masiva. Cada fila se intenta por separado y las que fallan se
   * devuelven con su motivo: un correo repetido en la fila 40 no puede
   * tirar las otras 39 que sí estaban bien.
   */
  async createManyPending(
    rows: CreateUserDto[],
    options: { activationTtlHours: number; defaultAccessMonths: number },
  ): Promise<{
    created: number;
    skipped: { email: string; reason: string }[];
  }> {
    const skipped: { email: string; reason: string }[] = [];
    let created = 0;

    for (const row of rows) {
      try {
        await this.userModel.create(this.pendingDocument(row, options));
        created += 1;
      } catch (error) {
        const duplicate =
          error instanceof Error && 'code' in error && error.code === 11000;
        skipped.push({
          email: row.email,
          reason: duplicate
            ? 'Ya existe una cuenta con ese correo.'
            : 'No se pudo crear.',
        });
      }
    }

    return { created, skipped };
  }

  private pendingDocument(
    dto: CreateUserDto,
    options: { activationTtlHours: number; defaultAccessMonths: number },
  ) {
    if (dto.accessExpiresAt && dto.accessExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'La fecha de vencimiento del acceso ya pasó.',
      );
    }

    // Sin fecha se aplica la vigencia por defecto. Para que no venza nunca
    // hay que mandar `null` explícito: olvidarse no debe regalar acceso
    // perpetuo sin que nadie lo haya decidido.
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + options.defaultAccessMonths);

    return {
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      role: dto.role,
      accessExpiresAt:
        dto.accessExpiresAt === undefined ? expiry : dto.accessExpiresAt,
      passwordHash: UNUSABLE_PASSWORD_HASH,
      status: UserStatus.PENDING_ACTIVATION,
      activationExpiresAt: new Date(
        Date.now() + options.activationTtlHours * 3_600_000,
      ),
    };
  }

  /**
   * Fija la contraseña y activa la cuenta en una sola operación condicionada
   * a que siga pendiente. Si dos peticiones llegan a la vez, solo una
   * encuentra el documento en ese estado: la segunda no encuentra nada.
   */
  activate(
    id: string,
    passwordHash: string,
    fromIp: string | null,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { _id: id, status: UserStatus.PENDING_ACTIVATION },
        {
          $set: {
            passwordHash,
            status: UserStatus.ACTIVE,
            activationExpiresAt: null,
            activatedAt: new Date(),
            activatedFromIp: fromIp,
          },
        },
        { new: true },
      )
      .exec();
  }

  findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
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

  async touchLastLogin(id: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } })
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
