import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import {
  KnowledgeVersion,
  KnowledgeVersionSchema,
} from './schemas/knowledge-version.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeVersion.name, schema: KnowledgeVersionSchema },
    ]),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
