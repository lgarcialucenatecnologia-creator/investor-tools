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
 * Se guardan las ENTRADAS y el RESULTADO, no solo las entradas. Si mañana
 * Luifer ajusta los porcentajes por defecto, un análisis viejo tiene que
 * seguir mostrando lo que mostró el día que se hizo: es la base sobre la que
 * alguien decidió comprar o no comprar.
 */
@Schema({ timestamps: true, collection: 'property_analyses' })
export class Analysis {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectName: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ required: true })
  listedPrice: number;

  @Prop({ required: true })
  areaM2: number;

  @Prop({ type: [ComparableSchema], default: [] })
  comparables: ComparableEntry[];

  @Prop({ required: true })
  deedCostRate: number;

  @Prop({ required: true })
  taxRate: number;

  @Prop({ required: true })
  refurbishCost: number;

  @Prop({ required: true })
  safetyMarginRate: number;

  /** El resultado tal como se calculó ese día. */
  @Prop({ type: Object, required: true })
  result: Record<string, number | boolean>;

  @Prop({ trim: true })
  notes?: string;
}

export type AnalysisDocument = HydratedDocument<Analysis>;
export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
