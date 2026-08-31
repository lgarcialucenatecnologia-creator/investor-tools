import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AskDto } from './dto/ask.dto';
import { ConsultantService } from './consultant.service';

@Controller('consultant')
export class ConsultantController {
  constructor(private readonly consultant: ConsultantService) {}

  /**
   * Pregunta y respuesta, emitida a medida que llega.
   *
   * Va por eventos del servidor y no como una respuesta normal porque una
   * respuesta larga tarda varios segundos en completarse: esperar en blanco a
   * que termine se siente roto, aunque no lo esté.
   *
   * El límite es por minuto y por sesión: cada mensaje cuesta dinero real.
   */
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('ask')
  async ask(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AskDto,
    @Res() response: Response,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    // Sin esto, un proxy intermedio puede acumular la respuesta y entregarla
    // de golpe al final, que es exactamente lo que se quería evitar.
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    try {
      for await (const event of this.consultant.ask(
        user.userId,
        dto.question,
        dto.conversationId,
      )) {
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No pude responder.';
      response.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      response.end();
    }
  }

  @Get('conversations')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.consultant.findAll(user.userId);
  }

  @Get('conversations/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.consultant.findOne(user.userId, id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('conversations/:id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.consultant.remove(user.userId, id);
  }
}
