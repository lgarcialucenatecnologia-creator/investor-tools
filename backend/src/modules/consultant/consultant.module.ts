import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChecklistModule } from '../checklist/checklist.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { UsersModule } from '../users/users.module';
import { CacheService } from './cache.service';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    KnowledgeModule,
    ChecklistModule,
    UsersModule,
  ],
  controllers: [ConsultantController],
  providers: [ConsultantService, CacheService],
})
export class ConsultantModule {}
