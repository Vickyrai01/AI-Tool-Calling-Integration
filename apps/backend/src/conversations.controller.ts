import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Conversation,
  ConversationDocument,
} from './schemas/conversations.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { Exercise, ExerciseDocument } from './schemas/exercise.schema';

@Controller('conversations')
export class ConversationsController {
  constructor(
    @InjectModel(Conversation.name)
    private ConversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private MessageModel: Model<MessageDocument>,
    @InjectModel(Exercise.name) private ExerciseModel: Model<ExerciseDocument>,
  ) {}

  @Get()
  async list() {
    const conversations = await this.ConversationModel.find({})
      .sort({ updatedAt: -1 })
      .lean();

    const results = await Promise.all(
      conversations.map(async (c: any) => {
        const lastMsg = await this.MessageModel.findOne({
          conversationId: c._id,
        })
          .sort({ createdAt: -1 })
          .lean();
        return {
          id: String(c._id),
          title: c.title ?? 'Conversación',
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          lastMessageAt: lastMsg?.createdAt ?? c.updatedAt,
          lastMessagePreview: lastMsg?.content?.slice(0, 120) ?? '',
        };
      }),
    );

    return results;
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Conversación inválida');
    }
    const conv = await this.ConversationModel.findById(id).lean();
    if (!conv) throw new NotFoundException('Conversación no encontrada');

    const messages = await this.MessageModel.find({
      conversationId: new Types.ObjectId(id),
    })
      .sort({ createdAt: 1 })
      .lean();

    const exercises = await this.ExerciseModel.find({
      conversationId: new Types.ObjectId(id),
    })
      .sort({ createdAt: 1 })
      .lean();

    return {
      id: String(conv._id),
      title: conv.title ?? 'Conversación',
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: messages.map((m: any) => ({
        id: String(m._id),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      exercises: exercises.map((e: any) => ({
        id: String(e._id),
        topic: e.topic,
        difficulty: e.difficulty,
        statement: e.statement,
        steps: e.steps,
        answer: e.answer,
        sourceUrl: e.sourceUrl,
        createdAt: e.createdAt,
      })),
    };
  }
}
