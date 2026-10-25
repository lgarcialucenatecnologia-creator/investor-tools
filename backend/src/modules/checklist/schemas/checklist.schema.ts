import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChecklistDocument = HydratedDocument<Checklist>;

/**
 * Un proyecto evaluado con el Check List.
 *
 * El checklist no es una foto del día en que se decidió: se va llenando a
 * medida que el inversionista averigua cada punto, sobre el mismo documento.
 *
 * Se guarda también el RESULTADO calculado al guardar. Si Luifer ajusta los
 * pesos, el histórico sigue mostrando lo que mostró cuando se guardó; al
 * abrirlo y volver a guardar, se recalcula con los pesos vigentes.
 */
@Schema({ timestamps: true, collection: 'checklists' })
export class Checklist {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectName: string;

  @Prop({ required: true, enum: ['vis', 'no_vis'] })
  projectType: 'vis' | 'no_vis';

  /** Calificación 1–5 por ítem. Los ausentes no se han calificado. */
  @Prop({ type: Object, default: {} })
  ratings: Record<string, number>;

  /** Observaciones, dudas o evidencia por ítem. */
  @Prop({ type: Object, default: {} })
  notes: Record<string, string>;

  @Prop({ type: Object, required: true })
  result: Record<string, unknown>;
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);

ChecklistSchema.index({ userId: 1, updatedAt: -1 });
