"use client";
import { useEffect, useMemo, useState } from "react";
import type { ConversationListItem } from "@/lib/types";
import { listConversations } from "@/lib/api";
import { deriveTitle, formatRelative } from "@/lib/conversationFormat";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshKey?: number;
  mode?: "desktop" | "drawer";
};

export default function ConversationsList({
  selectedId,
  onSelect,
  refreshKey,
  mode = "desktop",
}: Props) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listConversations();
      setItems(data);
    } catch {
      setError("No se pudieron cargar las conversaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      deriveTitle(c.title, c.lastMessagePreview).toLowerCase().includes(q),
    );
  }, [items, query]);

  const wrapperClasses =
    mode === "desktop"
      ? "hidden lg:flex w-80 border-r border-border h-screen sticky top-0 bg-white flex-col"
      : "flex h-full flex-col";

  return (
    <aside className={wrapperClasses} aria-label="Lista de conversaciones">
      <div className="shrink-0 p-3 border-b border-border bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h3 className="m-0 font-semibold">Conversaciones</h3>
          <button
            onClick={load}
            title="Actualizar"
            aria-label="Actualizar lista"
            disabled={loading}
            className="text-muted hover:text-text disabled:opacity-50"
          >
            ↻
          </button>
        </div>
        <div className="mt-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar conversaciones"
            className="w-full text-sm p-2 border border-border rounded-md"
          />
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-b border-red-200">
          {error}
        </div>
      )}
      {loading && (
        <div className="px-3 py-2 text-xs text-muted border-b border-border">
          Cargando…
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 && !loading && !error && (
          <div className="text-xs text-muted">Sin conversaciones aún</div>
        )}
        <div className="flex flex-col gap-2">
          {filtered.map((c) => {
            const title = deriveTitle(c.title, c.lastMessagePreview);
            const rel = formatRelative(c.lastMessageAt || c.updatedAt);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={[
                  "text-left p-3 border border-border rounded-md cursor-pointer transition-colors",
                  selectedId === c.id ? "bg-blue-50" : "bg-white",
                  "hover:bg-blue-50",
                ].join(" ")}
                aria-label={`Abrir conversación: ${title}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate">{title}</div>
                </div>
                <div className="text-[11px] text-muted mt-1">
                  {rel ? `Última actividad: ${rel}` : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
