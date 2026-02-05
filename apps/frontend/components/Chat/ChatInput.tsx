'use client';
import { useEffect, useRef, useState } from 'react';

export default function ChatInput({
  onSend,
  loading,
  maxLength = 800,
  placeholder = 'Ej: Generame 1 ejercicio de ecuaciones_lineales, dificultad media',
}: {
  onSend: (text: string) => void;
  loading: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleSend() {
    const text = input.trim();
    if (!text || loading || text.length > maxLength) return;
    onSend(text);
    setInput('');
  }

  const over = input.length > maxLength;

  return (
    <div className="sticky bottom-0 z-20 p-3 border-t border-border bg-white flex gap-2 items-center">
      <input
        ref={ref}
        aria-label="Mensaje"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={placeholder}
        className={[
          'flex-1 p-2 rounded-md border border-border focus:outline-none focus:ring-2',
          over ? 'focus:ring-red-500' : 'focus:ring-primary',
        ].join(' ')}
      />
      <span className={['text-xs', over ? 'text-red-600' : 'text-muted'].join(' ')}>
        {input.length}/{maxLength}
      </span>
      <button
        onClick={handleSend}
        disabled={loading || over}
        className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
      >
        {loading ? 'Enviando…' : 'Enviar'}
      </button>
    </div>
  );
}