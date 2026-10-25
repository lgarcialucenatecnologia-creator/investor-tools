import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PensionInputDto } from './dto/pension-input.dto';
import { PensionService } from './pension.service';

/** Mi Meta de Pensión. Un cálculo por persona, siempre el propio. */
@Controller('pension')
export class PensionController {
  constructor(private readonly pensionService: PensionService) {}

  /** Lo guardado, o un punto de partida armado con Mi Ruta. */
  @Get()
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.pensionService.overview(user.userId);
  }

  /** Calcula sin guardar. */
  @HttpCode(HttpStatus.OK)
  @Post('calculate')
  calculate(@Body() dto: PensionInputDto) {
    return this.pensionService.calculate(dto);
  }

  @Put()
  save(@CurrentUser() user: AuthenticatedUser, @Body() dto: PensionInputDto) {
    return this.pensionService.save(user.userId, dto);
  }
}
