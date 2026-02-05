import { Controller, Get, Req, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request } from 'express';
import { Conversation } from './schemas/conversations.schema';
import { Message } from './schemas/message.schema';
import { Exercise } from './schemas/exercise.schema';

@Controller('conversations')
export class ConversationsController {
  constructor(
    @InjectModel(Conversation.name)
    private ConversationModel: Model<Conversation>,
    @InjectModel(Message.name) private MessageModel: Model<Message>,
    @InjectModel(Exercise.name) private ExerciseModel: Model<Exercise>,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const userId = req.cookies?.client_id as string | undefined;
    const q: any = userId ? { userId } : {};
    const rows = await this.ConversationModel.find(q, {
      title: 1,
      lastMessagePreview: 1,
      updatedAt: 1,
      createdAt: 1,
      lastMessageAt: 1,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(200)
      .lean();

    return rows.map((c: any) => ({
      id: String(c._id),
      title: c.title ?? 'Conversación',
      lastMessagePreview: c.lastMessagePreview ?? '',
      updatedAt: c.updatedAt,
      lastMessageAt: c.lastMessageAt ?? c.updatedAt ?? c.createdAt,
    }));
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: Request) {
    const userId = req.cookies?.client_id as string | undefined;
    const _id = new Types.ObjectId(id);
    const conv = await this.ConversationModel.findOne({
      _id,
      ...(userId ? { userId } : {}),
    }).lean();
    if (!conv) return { error: 'not_found' };

    const messages = await this.MessageModel.find({ conversationId: _id })
      .sort({ createdAt: 1 })
      .select({ _id: 1, role: 1, content: 1, createdAt: 1 })
      .lean();

    const exercises = await this.ExerciseModel.find({ conversationId: _id })
      .sort({ createdAt: 1 })
      .select({
        _id: 1,
        topic: 1,
        difficulty: 1,
        statement: 1,
        steps: 1,
        answer: 1,
        sourceUrl: 1,
      })
      .lean();

    return {
      id,
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
      })),
    };
  }
}
