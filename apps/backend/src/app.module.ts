import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat.controller';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversations.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Exercise.name, schema: ExerciseSchema },
    ]),
  ],
  controllers: [
    AppController,
    ChatController,
    ConversationsController,
    MessagesController,
  ],
  providers: [AppService],
})
export class AppModule {}
