import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { StartingPointDto } from './dto/starting-point.dto';
import { RouteService } from './route.service';

/**
 * Mi Ruta de 90 Días. Todo es del usuario que lo pide: hay una ruta por
 * cuenta y ninguna consulta cruza de una a otra.
 */
@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Get()
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.routeService.overview(user.userId);
  }

  @Post('starting-point')
  saveStartingPoint(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartingPointDto,
  ) {
    return this.routeService.saveStartingPoint(user.userId, dto);
  }

  @Post('tasks/:taskId')
  toggleTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
  ) {
    return this.routeService.toggleTask(user.userId, taskId);
  }
}
