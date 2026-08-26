import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { CheckNewUserDto } from './dto/check-new-user.dto';
import { LoginDto } from './dto/login.dto';
import { SetInitialPasswordDto } from './dto/set-initial-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

/** Límite estricto para las rutas que aceptan credenciales. */
const CREDENTIAL_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

/**
 * El refresh no lleva credenciales pero sí se llama solo, desde varias
 * pestañas, así que necesita un cupo más holgado que el login.
 */
const REFRESH_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

/**
 * Activación: más estricto que el login. Es la pantalla desde la que se
 * podría barrer correos para averiguar quién es cliente, y a diferencia del
 * login nadie la usa varias veces seguidas de forma legítima.
 */
const ACTIVATION_THROTTLE = { default: { limit: 3, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('register')
  register(@Body() dto: RegisterDto, @Headers('user-agent') ua?: string) {
    return this.authService.register(dto, ua);
  }

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto, @Headers('user-agent') ua?: string) {
    return this.authService.login(dto, ua);
  }

  /** «Soy usuario nuevo»: ¿esta cuenta existe y sigue sin contraseña? */
  @Public()
  @Throttle(ACTIVATION_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('check-new-user')
  checkNewUser(@Body() dto: CheckNewUserDto) {
    return this.authService.checkNewUser(dto);
  }

  /** Crea la contraseña de una cuenta pendiente y deja al usuario dentro. */
  @Public()
  @Throttle(ACTIVATION_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('set-initial-password')
  setInitialPassword(
    @Body() dto: SetInitialPasswordDto,
    @Headers('user-agent') ua?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.setInitialPassword(dto, ua, ip);
  }

  @Public()
  @Throttle(REFRESH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.userId, user.sessionId);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
