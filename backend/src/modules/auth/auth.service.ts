import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { MongoServerError } from 'mongodb';
import { Types } from 'mongoose';
import { assertAccountUsable } from '../../common/access/account-access';
import type { JwtPayload } from '../../common/types/authenticated-user';
import { Session, UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 12;
const DUPLICATE_KEY = 11000;

/** Mensaje único para todo fallo de sesión: no revela en qué falló. */
const SESSION_GONE = 'Tu sesión expiró. Inicia sesión de nuevo.';

/**
 * Hash de descarte con el que se compara cuando el correo no existe, para
 * que el login tarde lo mismo exista o no la cuenta y no se pueda enumerar
 * usuarios midiendo el tiempo de respuesta.
 */
const DUMMY_HASH = bcrypt.hashSync('cuenta-inexistente', SALT_ROUNDS);

/**
 * Los refresh tokens se guardan como SHA-256, no con bcrypt: bcrypt trunca
 * su entrada a 72 bytes y dos JWT del mismo usuario comparten ese prefijo,
 * así que un token rotado seguiría validando. El token ya es de alta
 * entropía, no necesita un hash lento.
 */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function hashesMatch(a: string, b: string | null): boolean {
  if (!b) return false;
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: { id: string; fullName: string; email: string; role: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, userAgent?: string): Promise<AuthResult> {
    if (!this.config.getOrThrow<boolean>('selfRegistrationEnabled')) {
      // El acceso lo da el asesor tras la compra. La puerta pública queda
      // cerrada salvo que se abra a propósito por variable de entorno.
      throw new ForbiddenException(
        'Las cuentas se crean desde la administración. Escríbenos para activar la tuya.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.usersService.create({
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        passwordHash,
        phone: dto.phone,
      });
      return this.issueSession(user, userAgent);
    } catch (error) {
      // El índice único de `email` es la única fuente de verdad ante
      // registros simultáneos con el mismo correo.
      if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto, userAgent?: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // Después de la contraseña, nunca antes: al revés le confirmaría a un
    // desconocido que ese correo existe y está suspendido o vencido.
    assertAccountUsable(user);

    await this.usersService.touchLastLogin(user.id);
    return this.issueSession(user, userAgent);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException(SESSION_GONE);
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException(SESSION_GONE);
    }

    const user = await this.usersService.findByIdWithSessions(payload.sub);
    const session = user?.sessions.find(
      (s) => s.sid.toString() === payload.sid,
    );
    if (!user || !session) {
      throw new UnauthorizedException(SESSION_GONE);
    }

    assertAccountUsable(user);

    const presented = hashRefreshToken(refreshToken);
    const isCurrent = hashesMatch(presented, session.tokenHash);
    const graceOpen =
      session.previousValidUntil !== null &&
      session.previousValidUntil.getTime() > Date.now();
    const isRecentlyRotated =
      graceOpen && hashesMatch(presented, session.previousHash);

    if (!isCurrent && !isRecentlyRotated) {
      /**
       * El JWT es válido, pertenece a esta sesión, pero no es ni el vigente
       * ni el que acaba de rotarse. Eso ya no se explica por dos pestañas:
       * se asume reutilización de un token robado y se cierran TODAS las
       * sesiones del usuario, no solo esta.
       */
      await this.usersService.closeAllSessions(user.id);
      throw new UnauthorizedException(SESSION_GONE);
    }

    return this.rotateTokens(user, session.sid);
  }

  /** Cierra solo el dispositivo desde el que se pidió. */
  async logout(userId: string, sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) return;
    await this.usersService.closeSession(userId, new Types.ObjectId(sessionId));
  }

  private async issueSession(
    user: UserDocument,
    userAgent?: string,
  ): Promise<AuthResult> {
    const sid = new Types.ObjectId();
    const now = new Date();
    const tokens = await this.signPair(user, sid);

    const session: Session = {
      sid,
      tokenHash: hashRefreshToken(tokens.refreshToken),
      previousHash: null,
      previousValidUntil: null,
      userAgent: userAgent?.slice(0, 200),
      createdAt: now,
      lastUsedAt: now,
    };

    await this.usersService.openSession(
      user.id,
      session,
      this.config.getOrThrow<number>('session.maxPerUser'),
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async rotateTokens(
    user: UserDocument,
    sid: Types.ObjectId,
  ): Promise<AuthTokens> {
    const tokens = await this.signPair(user, sid);
    const graceMs = this.config.getOrThrow<number>('session.rotationGraceMs');

    // El hash saliente sigue valiendo un rato: es lo que evita que la
    // segunda pestaña, que refrescó a la vez, sea tomada por un ladrón.
    const outgoing = user.sessions.find((s) => s.sid.equals(sid))?.tokenHash;
    await this.usersService.rotateSession(
      user.id,
      sid,
      hashRefreshToken(tokens.refreshToken),
      outgoing ?? '',
      new Date(Date.now() + graceMs),
    );

    return tokens;
  }

  private async signPair(
    user: UserDocument,
    sid: Types.ObjectId,
  ): Promise<AuthTokens> {
    const base = { sub: user.id, email: user.email, sid: sid.toString() };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...base, typ: 'access' } satisfies JwtPayload,
        {
          secret: this.config.getOrThrow<string>('jwt.accessSecret'),
          expiresIn: this.config.getOrThrow<string>(
            'jwt.accessTtl',
          ) as SignOptions['expiresIn'],
        },
      ),
      // El `jti` es indispensable, no decorativo: sin él dos refrescos en el
      // mismo segundo devuelven el mismo token y la rotación no rota nada.
      this.jwtService.signAsync(
        { ...base, typ: 'refresh', jti: randomUUID() } satisfies JwtPayload,
        {
          secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
          expiresIn: this.config.getOrThrow<string>(
            'jwt.refreshTtl',
          ) as SignOptions['expiresIn'],
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
