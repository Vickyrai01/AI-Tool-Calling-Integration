import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { ObjectId } from 'bson';

import { ChatController } from '../../src/chat.controller';
import { ChatService } from '../../src/chat.service';

// Asegura que ChatService no falle en el constructor durante tests
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-openai-key';

// Mock: tool externa de GitHub
jest.mock('../../src/tools/fetchSeedExamples', () => ({
  fetchSeedExamplesFromGitHub: jest.fn(async () => ({
    examples: [
      {
        topic: 'ecuaciones_lineales',
        difficulty: 'alta',
        statement: 'stmt',
        answer: 'ans',
      },
    ],
    sourceUrl: 'https://github.com/owner/repo/blob/main/dataset/seed.json',
  })),
}));

type AnyDoc = Record<string, any>;

function makeInMemoryModel() {
  const data: AnyDoc[] = [];

  return {
    async create(doc: AnyDoc) {
      // Importante: Mongo espera ids tipo ObjectId (24 hex chars)
      const _id = new ObjectId().toHexString();
      const createdAt = new Date();
      const saved = { _id, createdAt, ...doc };
      data.push(saved);
      return saved;
    },

    async updateOne() {
      return { acknowledged: true, modifiedCount: 1 };
    },

    findById(id: any) {
      const found = data.find((d) => String(d._id) === String(id));
      return {
        lean: async () => (found ? { ...found } : null),
      };
    },

    findOne(query?: AnyDoc) {
      const found = data.find((d) => {
        if (!query) return true;

        if (query._id && String(d._id) !== String(query._id)) return false;

        if (
          query.conversationId &&
          String(d.conversationId) !== String(query.conversationId)
        )
          return false;

        return true;
      });

      return {
        lean: async () => (found ? { ...found } : null),
      };
    },

    find(query?: AnyDoc) {
      const res = data.filter((d) => {
        if (!query) return true;

        if (
          query.conversationId &&
          String(d.conversationId) !== String(query.conversationId)
        )
          return false;

        return true;
      });

      // Cadena estilo Mongoose
      return {
        select() {
          return this;
        },
        sort() {
          return this;
        },
        limit() {
          return this;
        },
        lean() {
          return res.map((r) => ({ ...r }));
        },
      };
    },
  };
}

describe('E2E /chat', () => {
  let app: INestApplication | undefined;
  let chatService: ChatService;
  let openaiMock: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, any> = {
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
              };
              return map[key];
            },
          },
        },

        // Stubs de modelos Mongoose
        {
          provide: getModelToken('Conversation'),
          useValue: makeInMemoryModel(),
        },
        { provide: getModelToken('Message'), useValue: makeInMemoryModel() },
        { provide: getModelToken('Exercise'), useValue: makeInMemoryModel() },
      ],
    }).compile();

    app = await moduleRef.createNestApplication().init();
    chatService = moduleRef.get(ChatService);

    // Mock de OpenAI
    openaiMock = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // Parchea la instancia interna del servicio para que use el mock
    (chatService as any).openai = openaiMock;
  });

  beforeEach(() => {
    // IMPORTANTE: si no reseteás, se acumulan llamadas entre tests (1 + 2 + 2 = 5)
    openaiMock?.chat?.completions?.create?.mockReset?.();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('responde texto cuando no hay tool_calls', async () => {
    openaiMock.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'Hola! Soy tu bot de ejercicios.',
            tool_calls: undefined,
          },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });

    const res = await request(app!.getHttpServer())
      .post('/chat')
      .send({ text: 'Hola' })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(res.body.text).toBe('Hola! Soy tu bot de ejercicios.');
    expect(openaiMock.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it('genera ejercicios con la tool fetchSeedExamplesFromGitHub', async () => {
    openaiMock.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  type: 'function',
                  id: 'tc_1',
                  function: {
                    name: 'fetchSeedExamplesFromGitHub',
                    arguments: JSON.stringify({
                      topic: 'ecuaciones_lineales',
                      difficulty: 'alta',
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                exercises: [
                  {
                    id: 'ej-001',
                    topic: 'ecuaciones_lineales',
                    difficulty: 'alta',
                    statement: 'La recta L1... ¿intersección L1 ∩ L2?',
                    steps: ['Paso 1', 'Paso 2'],
                    answer: '(2/3, 11/3)',
                    source: {
                      type: 'seed_examples_github',
                      url: 'https://github.com/owner/repo/blob/main/dataset/seed.json',
                    },
                  },
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 15, completion_tokens: 50 },
      });

    const res = await request(app!.getHttpServer())
      .post('/chat')
      .send({
        text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad alta',
      })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.exercises).toHaveLength(1);
    expect(res.body.source).toMatch(
      /github\.com\/owner\/repo\/blob\/main\/dataset\/seed\.json/,
    );

    // 2 llamadas: (1) pide tool, (2) follow-up con respuesta final
    expect(openaiMock.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('valida respuesta numérica con validateNumericAnswer', async () => {
    openaiMock.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  type: 'function',
                  id: 'tc_2',
                  function: {
                    name: 'validateNumericAnswer',
                    arguments: JSON.stringify({
                      userExpr: '2+2',
                      expectedExpr: '4',
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 18 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                'Correcto: tu resultado coincide con la respuesta esperada.',
            },
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 10 },
      });

    const res = await request(app!.getHttpServer())
      .post('/chat')
      .send({ text: 'Validá mi respuesta: 2+2=4' })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(res.body.text).toMatch(/Correcto/);

    // 2 llamadas: (1) tool_call, (2) follow-up final
    expect(openaiMock.chat.completions.create).toHaveBeenCalledTimes(2);
  });
});