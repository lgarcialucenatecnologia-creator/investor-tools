import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RouteModule } from '../route/route.module';
import { PensionController } from './pension.controller';
import { PensionService } from './pension.service';
import { PensionPlan, PensionPlanSchema } from './schemas/pension-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PensionPlan.name, schema: PensionPlanSchema },
    ]),
    // Para arrancar con lo que la persona ya contó en Mi Ruta.
    RouteModule,
  ],
  controllers: [PensionController],
  providers: [PensionService],
})
export class PensionModule {}
