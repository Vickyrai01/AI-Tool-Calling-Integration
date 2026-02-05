export type Role = "user" | "assistant" | "tool" | "system";

export type Exercise = {
  id: string;
  topic: string;
  difficulty: string;
  statement: string;
  steps: string[];
  answer: string;
  sourceUrl?: string;
};

export type ConversationListItem = {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
};

export type MessageItem = {
  id: string;
  role: Role;
  content: string;
  createdAt?: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messages: MessageItem[];
  exercises: Exercise[];
};

export type DebugToolEvent = {
  name: string;
  args?: Record<string, any>;
  status: "ok" | "error";
  ms?: number;
  summary?: string;
};

export type ChatMeta = {
  timings?: { initialMs?: number; followupMs?: number };
  tokens?: {
    initial?: any;
    followup?: any;
  };
  tools?: DebugToolEvent[];
  sourceUrl?: string;
};

export type ChatResponse =
  | { text: string; conversationId: string; source?: string; meta?: ChatMeta }
  | {
      data: { exercises: Exercise[] };
      conversationId: string;
      source?: string;
      meta?: ChatMeta;
    };
