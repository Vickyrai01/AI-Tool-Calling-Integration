"use client";
import { useEffect } from "react";
import ConversationsList from "./ConversationsList";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshKey?: number;
};

export default function ConversationsDrawer({
  open,
  onClose,
  selectedId,
  onSelect,
  refreshKey,
}: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute left-0 top-0 h-full w-11/12 max-w-[20rem] bg-white shadow-xl border-r border-border flex flex-col">
        <ConversationsList
          mode="drawer"
          selectedId={selectedId}
          onSelect={(id) => {
            onSelect(id);
            onClose();
          }}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
