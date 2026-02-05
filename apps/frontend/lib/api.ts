import { z } from 'zod';
import {
  ConversationListItem,
  ConversationDetail,
  ChatResponse,
} from './types';
import {
  ConversationListItemSchema,
  ConversationDetailSchema,
  ChatResponseSchema,
} from './schemas';

const API = process.env.NEXT_PUBLIC_API_URL;

function ensureApi() {
  if (!API) throw new Error('NEXT_PUBLIC_API_URL no está definido');
  return API!;
}

async function readBody(res: Response) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

function zArray<T extends z.ZodTypeAny>(schema: T) {
  return z.array(schema);
}

export async function listConversations(): Promise<ConversationListItem[]> {
  const base = ensureApi();
  const res = await fetch(`${base}/conversations`, { cache: 'no-store' });
  const { json, raw } = await readBody(res);
  if (!res.ok) throw new Error(`GET /conversations ${res.status}: ${raw.slice(0,200)}`);
  const parsed = zArray(ConversationListItemSchema).safeParse(json);
  if (!parsed.success) throw new Error('Formato inválido en conversaciones');
  return parsed.data;
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const base = ensureApi();
  const res = await fetch(`${base}/conversations/${id}`, { cache: 'no-store' });
  const { json, raw } = await readBody(res);
  if (!res.ok) throw new Error(`GET /conversations/${id} ${res.status}: ${raw.slice(0,200)}`);
  const parsed = ConversationDetailSchema.safeParse(json);
  if (!parsed.success) throw new Error('Formato inválido en detalle de conversación');
  return parsed.data;
}

// Fallback tolerante si Zod falla
function tolerantChatParse(json: any): ChatResponse {
  if (json && typeof json === 'object') {
    if (typeof json.text === 'string' && typeof json.conversationId === 'string') {
      return { text: json.text, conversationId: json.conversationId, source: json.source, meta: json.meta };
    }
    if (json.data && Array.isArray(json.data.exercises) && typeof json.conversationId === 'string') {
      // normalizar ids
      json.data.exercises = json.data.exercises.map((e: any) => ({ id: e.id ?? crypto.randomUUID(), ...e }));
      return { data: { exercises: json.data.exercises }, conversationId: json.conversationId, source: json.source, meta: json.meta };
    }
  }
  throw new Error('Formato inválido en respuesta de chat (fallback)');
}

export async function postChat(params: { text: string; conversationId?: string }): Promise<ChatResponse> {
  const base = ensureApi();
  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const { json, raw } = await readBody(res);
  if (!res.ok) throw new Error(`POST /chat ${res.status}: ${raw.slice(0,200)}`);

  // Primero intentamos con Zod
  const parsed = ChatResponseSchema.safeParse(json);
  if (parsed.success) {
    if ('data' in parsed.data) {
      parsed.data.data.exercises = parsed.data.data.exercises.map((e) => ({
        id: e.id ?? crypto.randomUUID(),
        ...e,
      }));
    }
    return parsed.data;
  }

  // Si falla Zod, usar parser tolerante
  return tolerantChatParse(json);
}