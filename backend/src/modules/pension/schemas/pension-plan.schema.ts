import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PensionPlanDocument = HydratedDocument<PensionPlan>;

/**
 * El cálculo guardado de cada persona. Uno por usuario: es SU número, no
 * una colección de escenarios. Se guardan los datos y no el resultado: si
 * Luifer cambia la rentabilidad por defecto, el número se recalcula con los
 * datos de la persona y la tasa que ella eligió.
 */
@Schema({ timestamps: true, collection: 'pension_plans' })
export class PensionPlan {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  input: Record<string, unknown>;
}

export const PensionPlanSchema = SchemaFactory.createForClass(PensionPlan);
