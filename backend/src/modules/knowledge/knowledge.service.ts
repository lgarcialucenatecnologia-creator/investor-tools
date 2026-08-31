import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleGenAI } from '@google/genai';
import { Model, Types } from 'mongoose';
import { countPages, extractPdf, splitSections } from './extractor';
import {
  KnowledgeStatus,
  KnowledgeVersion,
  KnowledgeVersionDocument,
} from './schemas/knowledge-version.schema';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private client: GoogleGenAI | null = null;

  constructor(
    @InjectModel(KnowledgeVersion.name)
    private readonly model: Model<KnowledgeVersionDocument>,
    private readonly config: ConfigService,
  ) {}

  /**
   * El cliente se crea la primera vez que hace falta, no al arrancar. Así el
   * backend levanta y el resto de la plataforma funciona aunque todavía no
   * exista la clave de Gemini.
   */
  private gemini(): GoogleGenAI {
    if (this.client) return this.client;
    const apiKey = this.config.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'Falta configurar la clave de Gemini para poder procesar el documento.',
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  async ingest(
    file: { originalname: string; path: string; buffer?: Buffer },
    userId: string,
    pdf: Buffer,
  ) {
    const pageCount = countPages(pdf);
    if (pageCount === 0) {
      throw new BadRequestException(
        'No se pudo leer el archivo como PDF. Revisa que no esté dañado.',
      );
    }

    this.logger.log(`Extrayendo «${file.originalname}» · ${pageCount} páginas`);

    const markdown = await extractPdf(
      this.gemini(),
      this.config.getOrThrow<string>('gemini.extractionModel'),
      file.path,
      pageCount,
      ({ batch, batches, fromPage, toPage }) =>
        this.logger.log(
          `  tanda ${batch}/${batches} · páginas ${fromPage}–${toPage}`,
        ),
    );

    const last = await this.model
      .findOne()
      .sort({ version: -1 })
      .select('version')
      .lean()
      .exec();

    const created = await this.model.create({
      version: (last?.version ?? 0) + 1,
      sourceFileName: file.originalname,
      pageCount,
      markdown,
      sections: splitSections(markdown),
      charCount: markdown.length,
      status: KnowledgeStatus.DRAFT,
      uploadedBy: new Types.ObjectId(userId),
    });

    return this.summarize(created);
  }

  async findAll() {
    const rows = await this.model
      .find()
      .sort({ version: -1 })
      .select('-markdown -sections')
      .lean()
      .exec();
    return rows.map((row) => ({
      id: String(row._id),
      version: row.version,
      sourceFileName: row.sourceFileName,
      pageCount: row.pageCount,
      charCount: row.charCount,
      status: row.status,
      activatedAt: row.activatedAt ?? null,
      createdAt: (row as unknown as { createdAt: Date }).createdAt,
      notes: row.notes ?? null,
    }));
  }

  async findOne(id: string) {
    const row = await this.byId(id);
    return {
      ...this.summarize(row),
      sections: row.sections.map((section) => ({
        order: section.order,
        title: section.title,
        body: section.body,
        edited: section.edited,
      })),
    };
  }

  /** La versión que responde ahora mismo. Puede no haber ninguna. */
  async findActive(): Promise<KnowledgeVersionDocument | null> {
    return this.model.findOne({ status: KnowledgeStatus.ACTIVE }).exec();
  }

  /** Corrige una sección a mano, sin volver a subir el PDF. */
  async editSection(id: string, order: number, body: string) {
    const row = await this.byId(id);
    if (row.status === KnowledgeStatus.ARCHIVED) {
      throw new BadRequestException(
        'Esta versión está archivada. Duplica una vigente para editarla.',
      );
    }

    const section = row.sections.find((item) => item.order === order);
    if (!section) throw new NotFoundException('No existe esa sección.');

    section.body = body;
    section.edited = true;
    row.markdown = this.rebuild(row);
    row.charCount = row.markdown.length;
    // El caché queda inválido: guarda un texto que ya no es el vigente.
    row.cacheName = null;
    row.cacheExpiresAt = null;
    row.markModified('sections');
    await row.save();

    return this.summarize(row);
  }

  /**
   * Pone una versión a responder. Solo puede haber una activa, así que la
   * anterior pasa a archivada en el mismo paso.
   */
  async activate(id: string) {
    const row = await this.byId(id);
    if (row.status === KnowledgeStatus.ACTIVE) return this.summarize(row);

    await this.model.updateMany(
      { status: KnowledgeStatus.ACTIVE },
      { $set: { status: KnowledgeStatus.ARCHIVED, cacheName: null } },
    );

    row.status = KnowledgeStatus.ACTIVE;
    row.activatedAt = new Date();
    await row.save();

    this.logger.log(`Versión ${row.version} activa`);
    return this.summarize(row);
  }

  private async byId(id: string): Promise<KnowledgeVersionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No encontramos esa versión.');
    }
    const row = await this.model.findById(id).exec();
    if (!row) throw new NotFoundException('No encontramos esa versión.');
    return row;
  }

  /** Rearma el documento desde las secciones, tras una corrección. */
  private rebuild(row: KnowledgeVersionDocument): string {
    return row.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) =>
        section.order === 0 && section.title === 'Introducción'
          ? section.body
          : `## ${section.title}\n\n${section.body}`,
      )
      .join('\n\n')
      .trim();
  }

  private summarize(row: KnowledgeVersionDocument) {
    return {
      id: row.id,
      version: row.version,
      sourceFileName: row.sourceFileName,
      pageCount: row.pageCount,
      charCount: row.charCount,
      sectionCount: row.sections.length,
      status: row.status,
      activatedAt: row.activatedAt,
      createdAt: (row as unknown as { createdAt: Date }).createdAt,
      notes: row.notes ?? null,
    };
  }
}
