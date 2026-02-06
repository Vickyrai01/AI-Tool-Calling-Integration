import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { SYSTEM_PROMPT, FEW_SHOTS } from './llm/prompt';
import { fetchSeedExamplesFromGitHub } from './tools/fetchSeedExamples';
import { validateNumericAnswer } from './tools/validateNumericAnswer';

import { GenerateExercisesResponseSchema } from '@pkg/shared';
import { Conversation } from './schemas/conversations.schema';
import { Message } from './schemas/message.schema';
import { Exercise } from './schemas/exercise.schema';

type DebugToolEvent = {
  name: string;
  args?: Record<string, any>;
  status: 'ok' | 'error';
  ms?: number;
  summary?: string;
};

// Helper: convertir contenido (posible JSON) en preview legible
function buildPreview(content: string): string {
  const raw = String(content || '').trim();
  if (!raw) return '';
  try {
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.exercises)) {
      const n = obj.exercises.length;
      const first = obj.exercises?.[0] || {};
      const topic = first?.topic ? String(first.topic) : '';
      const diff = first?.difficulty ? String(first.difficulty) : '';
      const parts = [`${n} ejercicio${n > 1 ? 's' : ''}`];
      if (topic) parts.push(topic);
      if (diff) parts.push(diff);
      return parts.join(' · ').slice(0, 120);
    }
  } catch {}
  return raw.replace(/\s+/g, ' ').slice(0, 120);
}

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Conversation.name)
    private ConversationModel: Model<Conversation>,
    @InjectModel(Message.name) private MessageModel: Model<Message>,
    @InjectModel(Exercise.name) private ExerciseModel: Model<Exercise>,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Missing OPENAI_API_KEY. Set it en apps/backend/.env o como variable.',
      );
    }

    this.openai = new OpenAI({
      apiKey,
      timeout: 25_000,
      maxRetries: 1,
    });
  }

  private async createWithRetry(
    params: Parameters<OpenAI['chat']['completions']['create']>[0],
    label: string,
    attempt = 0,
  ) {
    const start = Date.now();
    try {
      const res = await this.openai.chat.completions.create(params);
      const ms = Date.now() - start;
      this.logger.log(`openai:${label} ok (${ms}ms)`);
      return { res, ms };
    } catch (err: any) {
      const status = err?.status ?? err?.code;
      const msg = err?.message ?? String(err);
      this.logger.warn(
        `openai:${label} fail (status=${status}) attempt=${attempt} msg=${msg}`,
      );
      if (
        (status === 429 || (typeof status === 'number' && status >= 500)) &&
        attempt < 1
      ) {
        const backoff = 600 * Math.pow(2, attempt);
        this.logger.warn(`openai:${label} retry in ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        return this.createWithRetry(params, label, attempt + 1);
      }
      throw err;
    }
  }

  private async ensureConversation(conversationId?: string, userId?: string) {
    if (conversationId && Types.ObjectId.isValid(conversationId)) {
      return new Types.ObjectId(conversationId);
    }
    const created = await this.ConversationModel.create({
      title: 'Nueva conversación',
      userId,
      lastMessagePreview: '',
      lastMessageAt: new Date(),
    } as any);
    return new Types.ObjectId(created._id);
  }

  async handleMessage(text: string, conversationId?: string, userId?: string) {
    const clean = String(text ?? '').trim();
    if (!clean || clean.length > 2000) return { error: 'Input inválido' };

    const convId = await this.ensureConversation(conversationId, userId);

    const userMsg = await this.MessageModel.create({
      conversationId: convId,
      role: 'user',
      content: clean,
    });

    await this.ConversationModel.updateOne(
      {
        _id: convId,
        $or: [{ title: { $exists: false } }, { title: 'Nueva conversación' }],
      },
      { $set: { title: clean.slice(0, 60), userId } },
    );

    await this.ConversationModel.updateOne(
      { _id: convId },
      {
        $set: {
          lastMessagePreview: buildPreview(clean),
          lastMessageAt: (userMsg as any)?.createdAt ?? new Date(),
          userId,
        },
      },
    );

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

    // Inicial
    const init = await this.createWithRetry(
      {
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.2,
      },
      'initial',
    );

    const comp = init.res;
    const initialMs = init.ms;
    const initialUsage = comp?.usage;

    const choice = comp.choices[0];
    const toolCalls = (choice.message.tool_calls ?? []).filter(
      (tc) => tc.type === 'function',
    );

    const debugTools: DebugToolEvent[] = [];

    if (toolCalls.length > 0) {
      // Pares statement|answer usados en este mismo turno para evitar repetir subconjuntos del seed
      const seedPairsUsed = new Set<string>();

      const assistantMsg: ChatCompletionMessageParam = {
        role: 'assistant',
        content: choice.message.content ?? '',
        tool_calls: choice.message.tool_calls,
      };

      const toolMessages: ChatCompletionMessageParam[] = [];
      let lastSourceUrl: string | undefined;

      for (const tc of toolCalls) {
        const name = tc.function?.name;
        const args = (() => {
          try {
            return JSON.parse(tc.function?.arguments || '{}');
          } catch {
            return {};
          }
        })();

        if (name === 'fetchSeedExamplesFromGitHub') {
          const t0 = Date.now();
          try {
            const prior = await this.ExerciseModel.find({
              conversationId: convId,
            })
              .select({ statement: 1, answer: 1 })
              .lean();

            const excludeStatements = prior
              .map((e: any) => String(e.statement || '').trim())
              .filter(Boolean);
            const excludeAnswers = prior
              .map((e: any) => String(e.answer || '').trim())
              .filter(Boolean);
            const excludePairs = Array.from(seedPairsUsed);

            // Reducimos sampleCount para favorecer diversidad y no "pegarse" al seed completo
            const { examples, sourceUrl } = await fetchSeedExamplesFromGitHub({
              topic: args.topic,
              difficulty: args.difficulty,
              excludeStatements,
              excludeAnswers,
              excludePairs, // Evita repetir subconjuntos dentro del mismo turno
              sampleCount: 3,
            });
            const ms = Date.now() - t0;
            lastSourceUrl = sourceUrl;

            // Registrar pares usados en este turno
            for (const e of examples) {
              const key = `${String(e.statement).trim()}|${String(e.answer).trim()}`;
              seedPairsUsed.add(key);
            }

            await this.MessageModel.create({
              conversationId: convId,
              role: 'tool',
              content: JSON.stringify({
                examplesCount: examples.length,
                sourceUrl,
              }),
              metadata: { tool: 'fetchSeedExamplesFromGitHub' },
            });

            toolMessages.push({
              role: 'tool',
              tool_call_id: tc.id!,
              content: JSON.stringify({ examples, sourceUrl }),
            });

            debugTools.push({
              name,
              args: { topic: args.topic, difficulty: args.difficulty },
              status: 'ok',
              ms,
              summary: `examples=${examples.length}; excludePairs=${excludePairs.length}`,
            });
          } catch (e: any) {
            const ms = Date.now() - t0;
            this.logger.error(
              `tool:fetchSeedExamplesFromGitHub error: ${e?.message ?? e}`,
            );
            toolMessages.push({
              role: 'tool',
              tool_call_id: tc.id!,
              content: JSON.stringify({ error: 'seed_fetch_failed' }),
            });
            debugTools.push({
              name,
              args: { topic: args.topic, difficulty: args.difficulty },
              status: 'error',
              ms,
              summary: 'seed_fetch_failed',
            });
          }
        } else if (name === 'validateNumericAnswer') {
          const t0 = Date.now();
          try {
            const result = validateNumericAnswer(
              args.userExpr,
              args.expectedExpr,
            );
            const ms = Date.now() - t0;

            await this.MessageModel.create({
              conversationId: convId,
              role: 'tool',
              content: JSON.stringify(result),
              metadata: { tool: 'validateNumericAnswer' },
            });
            toolMessages.push({
              role: 'tool',
              tool_call_id: tc.id!,
              content: JSON.stringify(result),
            });

            debugTools.push({
              name,
              args: {
                userExpr: args.userExpr,
                expectedExpr: args.expectedExpr,
              },
              status: 'ok',
              ms,
              summary: `ok=${String(result.ok)}`,
            });
          } catch (e: any) {
            const ms = Date.now() - t0;
            this.logger.error(
              `tool:validateNumericAnswer error: ${e?.message ?? e}`,
            );
            toolMessages.push({
              role: 'tool',
              tool_call_id: tc.id!,
              content: JSON.stringify({ error: 'validate_failed' }),
            });
            debugTools.push({
              name,
              args: {
                userExpr: args.userExpr,
                expectedExpr: args.expectedExpr,
              },
              status: 'error',
              ms,
              summary: 'validate_failed',
            });
          }
        } else {
          toolMessages.push({
            role: 'tool',
            tool_call_id: tc.id!,
            content: JSON.stringify({ error: `Tool desconocida: ${name}` }),
          });
          debugTools.push({
            name: String(name),
            status: 'error',
            summary: 'unknown_tool',
          });
        }
      }

      // Follow-up
      const followComp = await this.createWithRetry(
        {
          model: 'gpt-4o-mini',
          messages: [...messages, assistantMsg, ...toolMessages],
          temperature: 0.4,
        },
        'followup',
      );
      const follow = followComp.res;
      const followupMs = followComp.ms;
      const followupUsage = follow?.usage;

      const content = follow.choices[0].message.content ?? '';

      // Actualizar preview con la respuesta del asistente (legible)
      await this.ConversationModel.updateOne(
        { _id: convId },
        { $set: { lastMessagePreview: buildPreview(content) } },
      );

      // JSON con exercises vacíos y "message" -> texto
      try {
        const raw = JSON.parse(content);
        if (
          raw &&
          Array.isArray(raw.exercises) &&
          raw.exercises.length === 0 &&
          typeof raw.message === 'string'
        ) {
          const assistantTextMsg = await this.MessageModel.create({
            conversationId: convId,
            role: 'assistant',
            content: raw.message,
            metadata: { sourceUrl: lastSourceUrl },
          });

          // Actualizar última actividad con el mensaje del asistente (texto)
          await this.ConversationModel.updateOne(
            { _id: convId },
            {
              $set: {
                lastMessagePreview: buildPreview(raw.message),
                lastMessageAt:
                  (assistantTextMsg as any)?.createdAt ?? new Date(),
              },
            },
          );

          return {
            text: raw.message,
            source: lastSourceUrl,
            conversationId: String(convId),
            meta: {
              timings: { initialMs, followupMs },
              tokens: {
                initial: initialUsage ?? null,
                followup: followupUsage ?? null,
              },
              tools: debugTools,
              sourceUrl: lastSourceUrl,
            },
          };
        }
      } catch {
        // continuar
      }

      // Intentar parsear ejercicios
      try {
        const parsed = GenerateExercisesResponseSchema.parse(
          JSON.parse(content),
        );

        const usedSourceType = lastSourceUrl
          ? 'seed_examples_github'
          : 'model_generated';
        (parsed as any).exercises = (parsed as any).exercises.map(
          (ex: any) => ({
            ...ex,
            source: ex.source ?? { type: usedSourceType, url: lastSourceUrl },
          }),
        );

        const assistantJsonMsg = await this.MessageModel.create({
          conversationId: convId,
          role: 'assistant',
          content: JSON.stringify(parsed),
          metadata: { sourceUrl: lastSourceUrl },
        });

        // Actualizar preview + última actividad
        await this.ConversationModel.updateOne(
          { _id: convId },
          {
            $set: {
              lastMessagePreview: buildPreview(JSON.stringify(parsed)),
              lastMessageAt: (assistantJsonMsg as any)?.createdAt ?? new Date(),
              userId,
            },
          },
        );

        // Persistir ejercicios con messageId y el mismo createdAt del mensaje del asistente
        for (const ex of parsed.exercises) {
          await this.ExerciseModel.create({
            conversationId: convId,
            messageId: assistantJsonMsg._id,
            topic: ex.topic,
            difficulty: ex.difficulty,
            statement: ex.statement,
            steps: ex.steps,
            answer: ex.answer,
            sourceUrl: ex.source?.url ?? lastSourceUrl,
            // forzar mismo createdAt para ordenar intercalado
            // @ts-ignore (Mongoose respetará si se provee createdAt)
            createdAt: (assistantJsonMsg as any)?.createdAt ?? new Date(),
          } as any);
        }

        return {
          data: parsed,
          source: lastSourceUrl,
          conversationId: String(convId),
          meta: {
            timings: { initialMs, followupMs },
            tokens: {
              initial: initialUsage ?? null,
              followup: followupUsage ?? null,
            },
            tools: debugTools,
            sourceUrl: lastSourceUrl,
          },
        };
      } catch (e: any) {
        this.logger.warn('Ocurrio un problema en el back');

        const assistantFallbackMsg = await this.MessageModel.create({
          conversationId: convId,
          role: 'assistant',
          content,
          metadata: { sourceUrl: lastSourceUrl },
        });

        // Actualizar última actividad con el mensaje del asistente (texto crudo)
        await this.ConversationModel.updateOne(
          { _id: convId },
          {
            $set: {
              lastMessagePreview: buildPreview(content),
              lastMessageAt:
                (assistantFallbackMsg as any)?.createdAt ?? new Date(),
            },
          },
        );

        return {
          text: content,
          source: lastSourceUrl,
          conversationId: String(convId),
          meta: {
            timings: { initialMs, followupMs },
            tokens: {
              initial: initialUsage ?? null,
              followup: followupUsage ?? null,
            },
            tools: debugTools,
            sourceUrl: lastSourceUrl,
          },
        };
      }
    }

    // Sin tools
    const raw = choice.message.content ?? '';

    // Actualizar preview con la respuesta del asistente
    await this.ConversationModel.updateOne(
      { _id: convId },
      { $set: { lastMessagePreview: buildPreview(raw) } },
    );

    try {
      const obj = JSON.parse(raw);
      if (
        obj &&
        Array.isArray(obj.exercises) &&
        obj.exercises.length === 0 &&
        (typeof obj.message === 'string' ||
          typeof obj.guidance === 'string' ||
          typeof obj.note === 'string' ||
          typeof obj.text === 'string')
      ) {
        const msgText =
          obj.message ?? obj.guidance ?? obj.note ?? obj.text ?? String(raw);

        const assistantNoToolMsg = await this.MessageModel.create({
          conversationId: convId,
          role: 'assistant',
          content: msgText,
        });

        // Actualizar última actividad
        await this.ConversationModel.updateOne(
          { _id: convId },
          {
            $set: {
              lastMessagePreview: buildPreview(msgText),
              lastMessageAt:
                (assistantNoToolMsg as any)?.createdAt ?? new Date(),
            },
          },
        );

        return {
          text: msgText,
          conversationId: String(convId),
          meta: {
            timings: { initialMs },
            tokens: { initial: initialUsage ?? null },
            tools: [],
          },
        };
      }
    } catch {
      // continuar
    }

    try {
      const parsed = GenerateExercisesResponseSchema.parse(JSON.parse(raw));

      // Sin tools: marcar como generado por modelo (sin URL)
      (parsed as any).exercises = (parsed as any).exercises.map((ex: any) => ({
        ...ex,
        source: ex.source ?? { type: 'model_generated' },
      }));

      const assistantNoToolJsonMsg = await this.MessageModel.create({
        conversationId: convId,
        role: 'assistant',
        content: JSON.stringify(parsed),
      });

      // Actualizar última actividad
      await this.ConversationModel.updateOne(
        { _id: convId },
        {
          $set: {
            lastMessagePreview: buildPreview(JSON.stringify(parsed)),
            lastMessageAt:
              (assistantNoToolJsonMsg as any)?.createdAt ?? new Date(),
          },
        },
      );

      for (const ex of parsed.exercises) {
        await this.ExerciseModel.create({
          conversationId: convId,
          topic: ex.topic,
          difficulty: ex.difficulty,
          statement: ex.statement,
          steps: ex.steps,
          answer: ex.answer,
          sourceUrl: ex.source?.url,
        });
      }
      return {
        data: parsed,
        conversationId: String(convId),
        meta: {
          timings: { initialMs },
          tokens: { initial: initialUsage ?? null },
          tools: [],
        },
      };
    } catch {
      const assistantRawMsg = await this.MessageModel.create({
        conversationId: convId,
        role: 'assistant',
        content: raw,
      });

      // Actualizar última actividad
      await this.ConversationModel.updateOne(
        { _id: convId },
        {
          $set: {
            lastMessagePreview: buildPreview(raw),
            lastMessageAt: (assistantRawMsg as any)?.createdAt ?? new Date(),
          },
        },
      );

      return {
        text: raw,
        conversationId: String(convId),
        meta: {
          timings: { initialMs },
          tokens: { initial: initialUsage ?? null },
          tools: [],
        },
      };
    }
  }
}
