import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { MongoServerError } from 'mongodb';
import type { JwtPayload } from '../../common/types/authenticated-user';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 12;
const DUPLICATE_KEY = 11000;

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

function hashesMatch(a: string, b: string): boolean {
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

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.usersService.create({
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        passwordHash,
        phone: dto.phone,
      });
      return this.issueSession(user);
    } catch (error) {
      // El índice único de `email` es la única fuente de verdad ante
      // registros simultáneos con el mismo correo.
      if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException(
        'Tu sesión expiró. Inicia sesión de nuevo.',
      );
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException(
        'Tu sesión expiró. Inicia sesión de nuevo.',
      );
    }

    if (!hashesMatch(hashRefreshToken(refreshToken), user.refreshTokenHash)) {
      // El JWT es válido pero no es el vigente: se asume reutilización de un
      // token ya rotado y se cierra la sesión por completo.
      await this.usersService.setRefreshTokenHash(user.id, null);
      throw new UnauthorizedException(
        'Tu sesión expiró. Inicia sesión de nuevo.',
      );
    }

    return this.rotateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async issueSession(user: UserDocument): Promise<AuthResult> {
    const tokens = await this.rotateTokens(user);
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

  private async rotateTokens(user: UserDocument): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: this.config.getOrThrow<string>(
          'jwt.accessTtl',
        ) as SignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.config.getOrThrow<string>(
          'jwt.refreshTtl',
        ) as SignOptions['expiresIn'],
      }),
    ]);

    await this.usersService.setRefreshTokenHash(
      user.id,
      hashRefreshToken(refreshToken),
    );

    return { accessToken, refreshToken };
  }
}
