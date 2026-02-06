import { z } from "zod";

export const ExerciseSchema = z.object({
  id: z.string().optional(),
  topic: z.string(),
  difficulty: z.string(),
  statement: z.string(),
  steps: z.array(z.string()),
  answer: z.string(),
  source: z
    .object({
      type: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  sourceUrl: z.string().url().optional(),
});

export const MessageItemSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "tool", "system"]),
  content: z.string(),
  createdAt: z.string().optional(),
});

export const ConversationListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastMessageAt: z.string().optional(),
  lastMessagePreview: z.string().optional(),
});

export const ConversationDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  messages: z.array(MessageItemSchema),
  exercises: z.array(ExerciseSchema),
});

const DebugToolEventSchema = z.object({
  name: z.string(),
  args: z.record(z.any()).optional(),
  status: z.enum(["ok", "error"]),
  ms: z.number().optional(),
  summary: z.string().optional(),
});
const ChatMetaSchema = z.object({
  timings: z
    .object({
      initialMs: z.number().optional(),
      followupMs: z.number().optional(),
    })
    .optional(),
  tokens: z
    .object({ initial: z.any().optional(), followup: z.any().optional() })
    .optional(),
  tools: z.array(DebugToolEventSchema).optional(),
  sourceUrl: z.string().optional(),
});

export const ChatTextResponseSchema = z.object({
  text: z.string(),
  conversationId: z.string(),
  source: z.string().optional(),
  meta: ChatMetaSchema.optional(),
});

export const ChatDataResponseSchema = z.object({
  data: z.object({
    exercises: z.array(ExerciseSchema),
  }),
  conversationId: z.string(),
  source: z.string().optional(),
  meta: ChatMetaSchema.optional(),
});

export const ChatResponseSchema = z.union([
  ChatTextResponseSchema,
  ChatDataResponseSchema,
]);
