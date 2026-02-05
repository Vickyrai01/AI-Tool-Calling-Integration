import { Controller, Get, Req, Param, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request, Response } from 'express';
import { Conversation } from './schemas/conversations.schema';
import { Message } from './schemas/message.schema';
import { Exercise } from './schemas/exercise.schema';

function ensureClientId(req: Request, res: Response) {
  let id = req.cookies?.client_id as string | undefined;
  if (!id || typeof id !== 'string' || id.length < 8) {
    id = crypto.randomUUID();
    res.cookie('client_id', id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 180 * 24 * 60 * 60 * 1000,
    });
  }
  return id;
}

@Controller('conversations')
export class ConversationsController {
  constructor(
    @InjectModel(Conversation.name)
    private ConversationModel: Model<Conversation>,
    @InjectModel(Message.name) private MessageModel: Model<Message>,
    @InjectModel(Exercise.name) private ExerciseModel: Model<Exercise>,
  ) {}

  @Get()
  async list(@Req() req: Request, @Res() res: Response) {
    const userId = ensureClientId(req, res);
    const rows = await this.ConversationModel.find(
      { userId },
      {
        title: 1,
        lastMessagePreview: 1,
        updatedAt: 1,
        createdAt: 1,
        lastMessageAt: 1,
      },
    )
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json(
      rows.map((c: any) => ({
        id: String(c._id),
        title: c.title ?? 'Conversación',
        lastMessagePreview: c.lastMessagePreview ?? '',
        updatedAt: c.updatedAt,
        lastMessageAt: c.lastMessageAt ?? c.updatedAt ?? c.createdAt,
      })),
    );
  }

  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = ensureClientId(req, res);
    const _id = new Types.ObjectId(id);
    const conv = await this.ConversationModel.findOne({ _id, userId }).lean();
    if (!conv) return res.json({ error: 'not_found' });

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
        createdAt: 1,
        messageId: 1,
      })
      .lean();

    return res.json({
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
        createdAt: e.createdAt,
        messageId: e.messageId ? String(e.messageId) : undefined,
      })),
    });
  }
}
