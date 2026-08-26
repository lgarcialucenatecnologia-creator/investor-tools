import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';
import { Analysis, AnalysisSchema } from './schemas/analysis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Analysis.name, schema: AnalysisSchema },
    ]),
  ],
  controllers: [FilterController],
  providers: [FilterService],
})
export class FilterModule {}
