import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { diskStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { EditSectionDto } from './dto/edit-section.dto';
import { KnowledgeService } from './knowledge.service';

/**
 * La base de conocimiento del Consultor. Solo administración: define qué
 * responde la herramienta a todos los clientes.
 */
@Roles(UserRole.ADMIN)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /**
   * El archivo se escribe a disco y no se retiene en memoria: un PDF de 130
   * páginas en RAM por cada subida simultánea es una forma tonta de tumbar el
   * proceso. Se borra en cuanto se transcribe.
   */
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: tmpdir() }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(
            new BadRequestException('Solo se admite un archivo PDF.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No llegó ningún archivo.');
    try {
      const pdf = await readFile(file.path);
      return await this.knowledgeService.ingest(file, user.userId, pdf);
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }

  @Get()
  findAll() {
    return this.knowledgeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Post(':id/sections')
  editSection(@Param('id') id: string, @Body() dto: EditSectionDto) {
    return this.knowledgeService.editSection(id, dto.order, dto.body);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.knowledgeService.activate(id);
  }
}
