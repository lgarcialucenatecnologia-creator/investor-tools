import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class ComparableEntry {
  @Prop({ required: true, trim: true })
  reference: string;

  @Prop({ required: true })
  areaM2: number;

  @Prop({ required: true })
  price: number;
}
export const ComparableSchema = SchemaFactory.createForClass(ComparableEntry);

/**
 * Un proyecto pasado por el filtro.
 *
 * Se guardan las RESPUESTAS y el RESULTADO, no solo las respuestas. Si mañana
 * Luifer ajusta los pesos, una evaluación vieja tiene que seguir mostrando lo
 * que mostró el día que se hizo: es la base sobre la que alguien decidió
 * comprar o no comprar.
 */
@Schema({ timestamps: true, collection: 'property_analyses' })
export class Analysis {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectName: string;

  @Prop({ trim: true })
  location?: string;

  /** Respuesta elegida para cada criterio. Los ausentes son «no sé». */
  @Prop({ type: Object, default: {} })
  answers: Record<string, string>;

  // ---- Comparación de precio, de la que sale el criterio derivado ----
  @Prop({ type: Number, default: null })
  listedPrice: number | null;

  @Prop({ type: Number, default: null })
  areaM2: number | null;

  @Prop({ type: [ComparableSchema], default: [] })
  comparables: ComparableEntry[];

  @Prop({ type: Object, default: null })
  pricing: Record<string, number | boolean> | null;

  /** La evaluación tal como se calculó ese día. */
  @Prop({ type: Object, required: true })
  result: Record<string, unknown>;

  @Prop({ trim: true })
  notes?: string;
}

export type AnalysisDocument = HydratedDocument<Analysis>;
export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
