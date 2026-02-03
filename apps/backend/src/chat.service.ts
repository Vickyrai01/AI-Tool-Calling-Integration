import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { SYSTEM_PROMPT, FEW_SHOTS } from './llm/prompt';
import { fetchSeedExamplesFromGitHub } from './tools/fetchSeedExamples';
import { validateNumericAnswer } from './tools/validateNumericAnswer';

import { GenerateExercisesResponseSchema } from '@pkg/shared/schema/intents';
import { Conversation } from './schemas/conversations.schema';
import { Message } from './schemas/message.schema';
import { Exercise } from './schemas/exercise.schema';

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;

  constructor(
    private readonly config: ConfigService,

    @InjectModel(Conversation.name)
    private ConversationModel: Model<Conversation>,

    @InjectModel(Message.name)
    private MessageModel: Model<Message>,

    @InjectModel(Exercise.name)
    private ExerciseModel: Model<Exercise>,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Missing OPENAI_API_KEY. Set it in apps/backend/.env (single line) or as an environment variable.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  private async ensureConversation(conversationId?: string) {
    if (conversationId) return new Types.ObjectId(conversationId);
    const created = await this.ConversationModel.create({
      title: 'Nueva conversación',
    });
    return new Types.ObjectId(created._id);
  }

  async handleMessage(text: string, conversationId?: string) {
    const clean = String(text ?? '').trim();
    if (!clean || clean.length > 2000) return { error: 'Input inválido' };

    const convId = await this.ensureConversation(conversationId);

    await this.MessageModel.create({
      conversationId: convId,
      role: 'user',
      content: clean,
    });

    const tools: ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'fetchSeedExamplesFromGitHub',
          description:
            'Trae ejemplos semilla del repo math-seed para tema/dificultad',
          parameters: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              difficulty: { type: 'string' },
            },
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'validateNumericAnswer',
          description:
            'Valida si la respuesta numérica del usuario coincide con la esperada',
          parameters: {
            type: 'object',
            properties: {
              userExpr: { type: 'string' },
              expectedExpr: { type: 'string' },
            },
            required: ['userExpr', 'expectedExpr'],
          },
        },
      },
    ];

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...FEW_SHOTS,
      { role: 'user', content: clean },
    ];

    const comp = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
    });

    const choice = comp.choices[0];
    const toolCall = choice.message.tool_calls?.[0];

    if (
      toolCall &&
      toolCall.type === 'function' &&
      toolCall.function?.name === 'fetchSeedExamplesFromGitHub'
    ) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const { examples, sourceUrl } = await fetchSeedExamplesFromGitHub({
        topic: args.topic,
        difficulty: args.difficulty,
      });

      await this.MessageModel.create({
        conversationId: convId,
        role: 'tool',
        content: JSON.stringify({ examplesCount: examples.length, sourceUrl }),
        metadata: { tool: 'fetchSeedExamplesFromGitHub' },
      });

      const assistantMsg: ChatCompletionMessageParam = {
        role: 'assistant',
        content: choice.message.content ?? '',
        tool_calls: choice.message.tool_calls,
      };

      const follow = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          ...messages,
          assistantMsg,
          {
            role: 'tool',
            tool_call_id: toolCall.id!,
            content: JSON.stringify({ examples, sourceUrl }),
          },
        ],
        temperature: 0.2,
      });

      const content = follow.choices[0].message.content ?? '';

      try {
        const parsed = GenerateExercisesResponseSchema.parse(
          JSON.parse(content),
        );

        await this.MessageModel.create({
          conversationId: convId,
          role: 'assistant',
          content: JSON.stringify(parsed),
          metadata: { sourceUrl },
        });

        for (const ex of parsed.exercises) {
          await this.ExerciseModel.create({
            conversationId: convId,
            topic: ex.topic,
            difficulty: ex.difficulty,
            statement: ex.statement,
            steps: ex.steps,
            answer: ex.answer,
            sourceUrl: ex.source?.url ?? sourceUrl,
          });
        }

        return {
          data: parsed,
          source: sourceUrl,
          conversationId: String(convId),
        };
      } catch {
        await this.MessageModel.create({
          conversationId: convId,
          role: 'assistant',
          content,
          metadata: { sourceUrl },
        });

        return {
          text: content,
          source: sourceUrl,
          conversationId: String(convId),
        };
      }
    }

    if (
      toolCall &&
      toolCall.type === 'function' &&
      toolCall.function?.name === 'validateNumericAnswer'
    ) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const result = validateNumericAnswer(args.userExpr, args.expectedExpr);

      await this.MessageModel.create({
        conversationId: convId,
        role: 'tool',
        content: JSON.stringify(result),
        metadata: { tool: 'validateNumericAnswer' },
      });

      const assistantMsg: ChatCompletionMessageParam = {
        role: 'assistant',
        content: choice.message.content ?? '',
        tool_calls: choice.message.tool_calls,
      };

      const follow = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          ...messages,
          assistantMsg,
          {
            role: 'tool',
            tool_call_id: toolCall.id!,
            content: JSON.stringify(result),
          },
        ],
        temperature: 0.2,
      });

      const finalText = follow.choices[0].message.content ?? '';

      await this.MessageModel.create({
        conversationId: convId,
        role: 'assistant',
        content: finalText,
      });

      return { text: finalText, conversationId: String(convId) };
    }

    const finalText = choice.message.content ?? '';

    await this.MessageModel.create({
      conversationId: convId,
      role: 'assistant',
      content: finalText,
    });

    return { text: finalText, conversationId: String(convId) };
  }
}
