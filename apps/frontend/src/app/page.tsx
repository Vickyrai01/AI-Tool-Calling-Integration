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
import WelcomeScreen from "@/components/Welcome/WelcomeScreen";
import type {
  Exercise,
  ConversationDetail,
  ChatResponse,
  ChatMeta,
} from "@/lib/types";
import { getConversation, postChat } from "@/lib/api";

type ChatItem =
  | {
      role: "user" | "assistant";
      kind: "text";
      text: string;
      createdAt?: string;
    }
  | {
      role: "assistant";
      kind: "exercises";
      exercises: Exercise[];
      createdAt?: string;
      messageId?: string;
    };

export default function ChatPage() {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugOn, setDebugOn] = useState(false);
  const [lastMeta, setLastMeta] = useState<ChatMeta | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      const timeline: ChatItem[] = [];

      const messages = Array.isArray(data?.messages) ? data.messages : [];
      for (const m of messages) {
        if (m.role !== "user" && m.role !== "assistant") continue;
        const text = String(m.content ?? "");
        const looksJson =
          text.trim().startsWith("{") || text.trim().startsWith("[");
        if (m.role === "assistant" && looksJson) continue;
        timeline.push({
          role: m.role,
          kind: "text",
          text,
          createdAt: m.createdAt,
        });
      }

      const exs = Array.isArray(data?.exercises) ? data.exercises : [];
      const groups = new Map<string, Exercise[]>();
      for (const e of exs) {
        const key = e.messageId || `ts:${e.createdAt}`;
        groups.set(key, [...(groups.get(key) ?? []), e]);
      }
      for (const [key, list] of groups.entries()) {
        const createdAt = list[0]?.createdAt;
        timeline.push({
          role: "assistant",
          kind: "exercises",
          exercises: list,
          createdAt,
          messageId: key,
        });
      }

      timeline.sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        return ta - tb;
      });

      setItems(timeline);
    } catch {
      setError("No se pudo cargar la conversación");
    }
  }, []);

  async function handleSend(text: string) {
    setError(null);
    const now = new Date().toISOString();
    setItems((m) => [
      ...m,
      { role: "user", kind: "text", text, createdAt: now },
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
        setRefreshKey((k) => k + 1); // Solo para actualizar sidebar
      }

      if ("data" in res && res.data?.exercises) {
        const exs: Exercise[] = res.data.exercises.map((e) => ({
          id: e.id ?? crypto.randomUUID(),
          topic: e.topic,
          difficulty: e.difficulty,
          statement: e.statement,
          steps: Array.isArray(e.steps) ? e.steps : [],
          answer: e.answer,
          sourceUrl: e.source?.url ?? e.sourceUrl,
          createdAt: now,
        }));
        setItems((m) => [
          ...m,
          {
            role: "assistant",
            kind: "exercises",
            exercises: exs,
            createdAt: now,
          },
        ]);
      } else if ("text" in res) {
        setItems((m) => [
          ...m,
          {
            role: "assistant",
            kind: "text",
            text: String(res.text),
            createdAt: now,
          },
        ]);
      } else {
        setItems((m) => [
          ...m,
          {
            role: "assistant",
            kind: "text",
            text: JSON.stringify(res, null, 2),
            createdAt: now,
          },
        ]);
      }
    } catch (e: any) {
      setError("Error al contactar el backend");
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
  // “Nueva conversación” crea un borrador local para habilitar el input y ocultar la bienvenida
  function handleNewConversation() {
    const draftId = `draft-${crypto.randomUUID()}`;
    setSelectedConvId(draftId);
    setItems([]);
    setLastMeta(undefined);
  }

  // Solo recargar conversación cuando el usuario selecciona explícitamente, no automáticamente
  // useEffect(() => {
  //   if (selectedConvId && !selectedConvId.startsWith("draft-")) {
  //     loadConversation(selectedConvId);
  //   }
  // }, [refreshKey, selectedConvId, loadConversation]);

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

  const showWelcome = !selectedConvId && items.length === 0;

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
          {showWelcome ? (
            <div className="flex-1 overflow-y-auto px-3 lg:px-4 pb-4 pt-6">
              <WelcomeScreen
                onQuickAction={(t) => handleQuickAction(t)}
                onStart={handleNewConversation} // NUEVO: CTA móvil desde la bienvenida
              />
            </div>
          ) : (
            <section
              id="chat-scroll"
              className="flex-1 overflow-y-auto px-3 lg:px-4 pb-4 pt-6"
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
          )}

          {debugOn && (
            <div className="hidden lg:block">
              <DebugSidebar meta={lastMeta} />
            </div>
          )}
        </div>

        {/* Footer: ocultar el input cuando mostramos la bienvenida */}
        <footer className="sticky bottom-0 z-20 border-t border-border bg-white">
          <div className="flex">
            <div className="flex-1 px-3 lg:px-4">
              <div className="max-w-full lg:max-w-2xl mx-auto w-full">
                {showWelcome ? (
                  <div className="text-xs text-muted py-3 text-center">
                    Elegí un atajo arriba o usa “Nueva conversación” para
                    empezar.
                  </div>
                ) : (
                  <ChatInput
                    onSend={handleSend}
                    loading={loading}
                    maxLength={800}
                  />
                )}
              </div>
            </div>
            {debugOn && (
              <div className="hidden lg:block w-96 border-l border-transparent" />
            )}
          </div>
        </footer>
      </main>

      <ConversationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedId={selectedConvId}
        onSelect={(id) => loadConversation(id)}
        refreshKey={refreshKey}
      />
      <DebugSheet
        open={debugOn}
        onClose={() => setDebugOn(false)}
        meta={lastMeta}
      />
      {!showWelcome && (
        <ScrollToBottom scrollContainerSelector="#chat-scroll" />
      )}
    </div>
  );
}
