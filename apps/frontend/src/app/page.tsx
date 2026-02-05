"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConversationsList from "@/components/Sidebar/ConversationsList";
import ConversationsDrawer from "@/components/Sidebar/ConversationsDrawer";
import MessageBubble from "@/components/Chat/MessageBubble";
import ExerciseCard from "@/components/Chat/ExerciseCard";
import ChatInput from "@/components/Chat/ChatInput";
import ErrorBanner from "@/components/UI/ErrorBanner";
import DebugSidebar from "@/components/Debug/DebugSidebar";
import DebugSheet from "@/components/Debug/DebugSheet";
import AppHeader from "@/components/Header/AppHeader";
import ScrollToBottom from "@/components/UI/ScrollToBottom";
import type {
  Exercise,
  ConversationDetail,
  ChatResponse,
  ChatMeta,
} from "@/lib/types";
import { getConversation, postChat } from "@/lib/api";

function parseExercisesJson(content: string): { exercises: Exercise[] } | null {
  try {
    const obj = JSON.parse(content);
    if (obj && Array.isArray(obj.exercises) && obj.exercises.length > 0) {
      const exs = obj.exercises.map((e: any) => ({
        id: String(e.id ?? crypto.randomUUID()),
        topic: String(e.topic ?? ""),
        difficulty: String(e.difficulty ?? ""),
        statement: String(e.statement ?? ""),
        steps: Array.isArray(e.steps) ? e.steps.map(String) : [],
        answer: String(e.answer ?? ""),
        sourceUrl: e.source?.url ?? e.sourceUrl,
      }));
      return { exercises: exs };
    }
  } catch {}
  return null;
}

type ChatItem =
  | {
      role: "user" | "assistant";
      kind: "text";
      text: string;
      createdAt?: string;
    }
  | { role: "assistant"; kind: "exercises"; exercises: Exercise[] };

export default function ChatPage() {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugOn, setDebugOn] = useState(false);
  const [lastMeta, setLastMeta] = useState<ChatMeta | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false); // NUEVO: conversaciones móvil

  useEffect(() => {
    setDebugOn(localStorage.getItem("debugOn") === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("debugOn", debugOn ? "1" : "0");
  }, [debugOn]);

  const loadConversation = useCallback(async (id: string) => {
    setSelectedConvId(id);
    setError(null);
    setItems([]);
    setLastMeta(undefined);
    try {
      const data: ConversationDetail = await getConversation(id);
      const msgItems: ChatItem[] = [];
      const messages = Array.isArray(data?.messages) ? data.messages : [];

      for (const m of messages) {
        if (m.role !== "user" && m.role !== "assistant") continue;
        const text = String(m.content ?? "");
        if (m.role === "assistant") {
          const parsed = parseExercisesJson(text);
          if (parsed) continue;
        }
        msgItems.push({
          role: m.role,
          kind: "text",
          text,
          createdAt: m.createdAt,
        });
      }
      if (Array.isArray(data?.exercises) && data.exercises.length > 0) {
        msgItems.push({
          role: "assistant",
          kind: "exercises",
          exercises: data.exercises.map((e: any) => ({
            id: String(e.id ?? e._id ?? crypto.randomUUID()),
            topic: String(e.topic ?? ""),
            difficulty: String(e.difficulty ?? ""),
            statement: String(e.statement ?? ""),
            steps: Array.isArray(e.steps) ? e.steps.map(String) : [],
            answer: String(e.answer ?? ""),
            sourceUrl: e.sourceUrl,
          })),
        });
      }
      setItems(msgItems);
    } catch {
      setError("No se pudo cargar la conversación");
    }
  }, []);

  async function handleSend(text: string) {
    setError(null);
    setItems((m) => [
      ...m,
      { role: "user", kind: "text", text, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const res: ChatResponse = await postChat({
        text,
        conversationId: selectedConvId ?? undefined,
      });

      const meta: ChatMeta | undefined = (res as any).meta;
      setLastMeta(meta);

      if (res.conversationId && res.conversationId !== selectedConvId) {
        setSelectedConvId(res.conversationId);
        setRefreshKey((k) => k + 1);
      }
      if ("data" in res && res.data?.exercises) {
        const exs: Exercise[] = res.data.exercises.map((e) => ({
          id: e.id ?? crypto.randomUUID(),
          ...e,
        }));
        setItems((m) => [
          ...m,
          { role: "assistant", kind: "exercises", exercises: exs },
        ]);
      } else if ("text" in res) {
        setItems((m) => [
          ...m,
          {
            role: "assistant",
            kind: "text",
            text: String(res.text),
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setItems((m) => [
          ...m,
          {
            role: "assistant",
            kind: "text",
            text: JSON.stringify(res, null, 2),
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e: any) {
      const msg = e?.message
        ? String(e.message)
        : "Error al contactar el backend";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(text: string) {
    handleSend(text);
  }
  function handleRegenerate(ex: Exercise) {
    const text = `Generame 1 ejercicio de ${ex.topic}, dificultad ${ex.difficulty} similar al anterior pero con números diferentes`;
    handleSend(text);
  }
  function handleNewConversation() {
    setSelectedConvId(null);
    setItems([]);
    setLastMeta(undefined);
  }

  useEffect(() => {
    if (selectedConvId) loadConversation(selectedConvId);
  }, [refreshKey, selectedConvId, loadConversation]);

  const sidebar = useMemo(
    () => (
      <ConversationsList
        mode="desktop"
        selectedId={selectedConvId}
        onSelect={(id) => loadConversation(id)}
        refreshKey={refreshKey}
      />
    ),
    [selectedConvId, loadConversation, refreshKey],
  );

  return (
    <div className="flex h-screen">
      {sidebar}

      <main className="flex-1 flex flex-col overflow-hidden bg-bg">
        <AppHeader
          onPrompt={handleQuickAction}
          onToggleDebug={() => setDebugOn((v) => !v)}
          debugOn={debugOn}
          onNewConversation={handleNewConversation}
          onOpenConversations={() => setDrawerOpen(true)}
        />

        {error && (
          <ErrorBanner message={error} onClose={() => setError(null)} />
        )}

        <div className="flex flex-1 overflow-hidden">
          <section
            id="chat-scroll" className="flex-1 overflow-y-auto px-3 lg:px-4 pb-4 pt-6"
          >
            <div className="max-w-full lg:max-w-2xl mx-auto w-full flex flex-col gap-3">
              {items.map((it, i) => {
                if (it.kind === "text") {
                  return (
                    <MessageBubble
                      key={i}
                      role={it.role}
                      createdAt={it.createdAt}
                    >
                      {it.text}
                    </MessageBubble>
                  );
                }
                return (
                  <div key={i} className="grid gap-3">
                    {it.exercises.map((ex) => (
                      <ExerciseCard
                        key={ex.id}
                        ex={ex}
                        onRegenerate={handleRegenerate}
                      />
                    ))}
                  </div>
                );
              })}
              {loading && <div className="text-muted">Pensando…</div>}
            </div>
          </section>

          {/* Debug: sidebar en desktop, bottom sheet en mobile */}
          {debugOn && (
            <div className="hidden lg:block">
              <DebugSidebar meta={lastMeta} />
            </div>
          )}
        </div>

        {/* Footer con placeholder del ancho del debug en desktop */}
        <footer className="sticky bottom-0 z-20 border-t border-border bg-white">
          <div className="flex">
            <div className="flex-1 px-3 lg:px-4">
              <div className="max-w-full lg:max-w-2xl mx-auto w-full">
                <ChatInput
                  onSend={handleSend}
                  loading={loading}
                  maxLength={800}
                />
              </div>
            </div>
            {debugOn && (
              <div className="hidden lg:block w-96 border-l border-transparent" />
            )}
          </div>
        </footer>
      </main>

      {/* Drawer móvil de conversaciones */}
      <ConversationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedId={selectedConvId}
        onSelect={(id) => loadConversation(id)}
        refreshKey={refreshKey}
      />

      {/* Debug bottom sheet en móvil */}
      <DebugSheet
        open={debugOn && !!lastMeta}
        onClose={() => setDebugOn(false)}
        meta={lastMeta}
      />

      <ScrollToBottom scrollContainerSelector="#chat-scroll" />
    </div>
  );
}
