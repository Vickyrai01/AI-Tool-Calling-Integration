'use client';
import { useEffect } from 'react';
import ConversationsList from './ConversationsList';

type Props = {
  open: boolean;
  onClose: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshKey?: number;
};

export default function ConversationsDrawer({ open, onClose, selectedId, onSelect, refreshKey }: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-11/12 max-w-[20rem] bg-white shadow-xl border-r border-border flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="m-0 font-semibold text-sm">Conversaciones</h3>
          <button
            className="text-sm text-muted hover:text-text"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationsList selectedId={selectedId} onSelect={(id) => { onSelect(id); onClose(); }} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}