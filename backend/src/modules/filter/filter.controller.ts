import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { FilterService } from './filter.service';

/**
 * Filtro de Seguridad. Todo aquí es del usuario que lo pide: el guard de
 * sesión ya es global y cada consulta filtra además por su identificador.
 */
@Controller('filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Get('defaults')
  defaults() {
    return this.filterService.defaults();
  }

  /** Calcula sin guardar, para que el resultado se vea mientras se escribe. */
  @HttpCode(HttpStatus.OK)
  @Post('preview')
  preview(@Body() dto: CreateAnalysisDto) {
    return this.filterService.preview(dto);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAnalysisDto,
  ) {
    return this.filterService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.filterService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.filterService.findOne(user.userId, id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.filterService.remove(user.userId, id);
  }
}
