import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ChecklistService } from './checklist.service';
import { AssessChecklistDto, SaveChecklistDto } from './dto/save-checklist.dto';

/**
 * Check List. Todo aquí es del usuario que lo pide: el guard de sesión ya es
 * global y cada consulta filtra además por su identificador.
 */
@Controller('checklist')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  /** Secciones, ítems, pesos y guías. */
  @Get('form')
  form() {
    return this.checklistService.form();
  }

  /** Calcula sin guardar, para que el resultado se vea mientras se califica. */
  @HttpCode(HttpStatus.OK)
  @Post('assess')
  assess(@Body() dto: AssessChecklistDto) {
    return this.checklistService.assess(dto);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveChecklistDto,
  ) {
    return this.checklistService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.checklistService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.checklistService.findOne(user.userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SaveChecklistDto,
  ) {
    return this.checklistService.update(user.userId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.checklistService.remove(user.userId, id);
  }
}
