import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum KnowledgeStatus {
  /** Extraída, todavía sin revisar. No responde nada. */
  DRAFT = 'draft',
  /** Revisada y en uso. Solo puede haber una. */
  ACTIVE = 'active',
  /** Fue activa y quedó reemplazada. Se conserva. */
  ARCHIVED = 'archived',
}

@Schema({ _id: false })
export class KnowledgeSection {
  @Prop({ required: true })
  order: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  body: string;

  /** Marca lo que una persona corrigió a mano tras la extracción. */
  @Prop({ default: false })
  edited: boolean;
}
export const KnowledgeSectionSchema =
  SchemaFactory.createForClass(KnowledgeSection);

/**
 * Una versión de la base de conocimiento del Consultor.
 *
 * Se versiona en vez de reemplazar. Si dentro de tres meses alguien pregunta
 * «¿por qué el Consultor me dijo esto?», hay que poder responder con qué
 * material contestó. Una respuesta vieja apoyada en un documento viejo tiene
 * que ser rastreable.
 */
@Schema({ timestamps: true, collection: 'knowledge_versions' })
export class KnowledgeVersion {
  @Prop({ required: true, index: true })
  version: number;

  @Prop({ required: true, trim: true })
  sourceFileName: string;

  @Prop({ required: true })
  pageCount: number;

  /** El documento completo, ya limpio. Es la fuente de verdad. */
  @Prop({ required: true })
  markdown: string;

  /**
   * El mismo contenido partido por títulos. No sirve para buscar —el
   * documento entero va al contexto— sino para que Luifer vea qué se extrajo
   * y corrija un párrafo sin volver a subir el PDF.
   */
  @Prop({ type: [KnowledgeSectionSchema], default: [] })
  sections: KnowledgeSection[];

  @Prop({ required: true })
  charCount: number;

  @Prop({
    type: String,
    enum: Object.values(KnowledgeStatus),
    default: KnowledgeStatus.DRAFT,
    index: true,
  })
  status: KnowledgeStatus;

  /**
   * El caché vivo en Gemini, si existe. Es una optimización desechable: si
   * vence o falla, se manda el texto completo en línea. El chat nunca se cae
   * por un problema de caché.
   */
  @Prop({ type: String, default: null })
  cacheName: string | null;

  @Prop({ type: Date, default: null })
  cacheExpiresAt: Date | null;

  @Prop({ type: Types.ObjectId, required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  activatedAt: Date | null;

  @Prop({ trim: true })
  notes?: string;
}

export type KnowledgeVersionDocument = HydratedDocument<KnowledgeVersion>;
export const KnowledgeVersionSchema =
  SchemaFactory.createForClass(KnowledgeVersion);
