import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationsController } from './conversations.controller';

import {
  Conversation,
  ConversationSchema,
} from './schemas/conversations.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env')],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Exercise.name, schema: ExerciseSchema },
    ]),
  ],
  controllers: [ChatController, ConversationsController],
  providers: [ChatService],
})
export class AppModule {}
