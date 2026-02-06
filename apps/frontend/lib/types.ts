export type Role = "user" | "assistant" | "tool" | "system";

export type Exercise = {
  id: string;
  topic: string;
  difficulty: string;
  statement: string;
  steps: string[];
  answer: string;
  source?: {
    type?: string;
    url?: string;
  };
  sourceUrl?: string;
  createdAt?: string;
  messageId?: string;
};

export type ConversationListItem = {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
  }[];
  exercises: Exercise[];
};

export type MessageItem = {
  id: string;
  role: Role;
  content: string;
  createdAt?: string;
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
