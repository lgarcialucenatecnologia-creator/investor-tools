import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class StartingPointDoc {
  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  propertyType?: string;

  @Prop({ required: true })
  availableCash: number;

  @Prop({ required: true })
  safetyReserve: number;

  @Prop({ required: true })
  monthlyIncome: number;

  @Prop({ required: true })
  monthlyObligations: number;

  @Prop({ required: true })
  possibleCredit: number;

  @Prop({ trim: true })
  goal?: string;

  @Prop({ trim: true })
  mainDifficulty?: string;
}
export const StartingPointSchema =
  SchemaFactory.createForClass(StartingPointDoc);

@Schema({ _id: false })
export class TaskMark {
  @Prop({ required: true })
  taskId: string;

  @Prop({ type: Date, required: true })
  at: Date;
}
export const TaskMarkSchema = SchemaFactory.createForClass(TaskMark);

/**
 * La ruta de una persona. Una sola por cuenta.
 *
 * Se guarda cuándo arrancó porque el día en que va no es un dato que se
 * declare: se cuenta. Y se guardan solo las marcas MANUALES — las tareas que
 * se demuestran con trabajo hecho en el Filtro se recalculan en cada consulta,
 * así que si alguien borra una evaluación su avance se ajusta solo.
 */
@Schema({ timestamps: true, collection: 'routes' })
export class Route {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: StartingPointSchema, default: null })
  startingPoint: StartingPointDoc | null;

  /** El día uno. Se fija al guardar el Punto de Partida. */
  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: [TaskMarkSchema], default: [] })
  marks: TaskMark[];
}

export type RouteDocument = HydratedDocument<Route>;
export const RouteSchema = SchemaFactory.createForClass(Route);
