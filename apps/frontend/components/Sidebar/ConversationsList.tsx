'use client';
import { useEffect, useState } from 'react';
import type { ConversationListItem } from '@/lib/types';
import { listConversations } from '@/lib/api';

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshKey?: number;
};

export default function ConversationsList({ selectedId, onSelect, refreshKey }: Props) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listConversations();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  return (
    <aside className="hidden lg:block w-80 border-r border-border h-screen overflow-y-auto sticky top-0 bg-white">
      <div className="flex items-center justify-between p-3 border-b border-border">
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

      {loading && <div className="text-xs text-muted px-3 py-2">Cargando…</div>}

      <div className="flex flex-col gap-2 p-3">
        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            title={c.lastMessagePreview}
            className={[
              'text-left p-3 border border-border rounded-md cursor-pointer',
              selectedId === c.id ? 'bg-blue-50' : 'bg-white',
              'hover:bg-blue-50',
            ].join(' ')}
          >
            <div className="font-semibold">{c.title || 'Conversación'}</div>
            <div className="text-xs text-muted truncate">{c.lastMessagePreview || ''}</div>
          </button>
        ))}
        {items.length === 0 && !loading && (
          <div className="text-xs text-muted">Sin conversaciones aún</div>
        )}
      </div>
    </aside>
  );
}