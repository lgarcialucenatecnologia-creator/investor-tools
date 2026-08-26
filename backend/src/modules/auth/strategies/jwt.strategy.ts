import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/types/authenticated-user';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  /**
   * Se consulta la BD en cada petición para que una cuenta eliminada
   * deje de tener acceso sin esperar a que expire el token.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Un refresh no sirve como token de acceso aunque los secretos se
    // hubieran configurado iguales por error.
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Tu sesión ya no es válida.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Tu sesión ya no es válida.');
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sid,
    };
  }
}
