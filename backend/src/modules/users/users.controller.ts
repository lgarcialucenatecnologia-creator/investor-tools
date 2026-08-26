import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { MongoServerError } from 'mongodb';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from './schemas/user.schema';
import { UsersService } from './users.service';

const DUPLICATE_KEY = 11000;

/** Dar de alta cuesta poco al servidor pero mucho si se automatiza. */
const ADMIN_WRITE_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

/**
 * Panel de administración. `@Roles` a nivel de clase: el guard de sesión y el
 * de roles ya son globales, así que basta este decorador para que todo lo de
 * aquí exija rol de administrador.
 */
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  private get creationOptions() {
    return {
      activationTtlHours: this.config.getOrThrow<number>('activation.ttlHours'),
      defaultAccessMonths: this.config.getOrThrow<number>(
        'access.defaultMonths',
      ),
    };
  }

  @Throttle(ADMIN_WRITE_THROTTLE)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    try {
      const user = await this.usersService.createPending(
        dto,
        this.creationOptions,
      );
      return this.usersService.sanitize(user);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw error;
    }
  }

  /** Alta masiva desde un archivo. Las filas con error se informan. */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateUsersDto) {
    return this.usersService.createManyPending(dto.users, this.creationOptions);
  }

  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.usersService.stats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('No encontramos esa cuenta.');
    return this.usersService.sanitize(user);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const target = await this.usersService.findById(id);
    if (!target) throw new NotFoundException('No encontramos esa cuenta.');

    const losesAdmin =
      target.role === UserRole.ADMIN &&
      (dto.role === UserRole.INVESTOR ||
        dto.role === UserRole.ADVISOR ||
        dto.status === UserStatus.SUSPENDED);

    if (losesAdmin) {
      // Quitarse a uno mismo el mando deja fuera al único que podía
      // devolvérselo, y no queda nadie capaz de arreglarlo desde la app.
      if (actor.userId === id) {
        throw new BadRequestException(
          'No puedes quitarte a ti mismo la administración. Pídeselo a otro administrador.',
        );
      }
      if ((await this.usersService.countOtherUsableAdmins(id)) === 0) {
        throw new BadRequestException(
          'Es el único administrador activo. Nombra a otro antes de cambiarlo.',
        );
      }
    }

    const updated = await this.usersService.update(id, dto);
    return this.usersService.sanitize(updated!);
  }

  /**
   * Devuelve la cuenta al estado «pendiente»: sirve para quien perdió la
   * contraseña y para quien dejó vencer el plazo. Vuelve a entrar por
   * «Soy usuario nuevo».
   */
  @Throttle(ADMIN_WRITE_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    if (actor.userId === id) {
      throw new BadRequestException(
        'Para cambiar tu propia contraseña usa el cambio de contraseña, no el reinicio.',
      );
    }
    const user = await this.usersService.reopenActivation(
      id,
      this.creationOptions.activationTtlHours,
    );
    if (!user) throw new NotFoundException('No encontramos esa cuenta.');
    return this.usersService.sanitize(user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.userId === id) {
      throw new BadRequestException('No puedes borrar tu propia cuenta.');
    }
    const target = await this.usersService.findById(id);
    if (!target) throw new NotFoundException('No encontramos esa cuenta.');

    if (
      target.role === UserRole.ADMIN &&
      (await this.usersService.countOtherUsableAdmins(id)) === 0
    ) {
      throw new BadRequestException(
        'Es el único administrador activo. Nombra a otro antes de borrarlo.',
      );
    }

    await this.usersService.remove(id);
  }
}
