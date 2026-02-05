'use client';
import { PropsWithChildren } from 'react';

function formatRelative(ts?: string | number | Date) {
  if (!ts) return '';
  const d = typeof ts === 'string' ? new Date(ts) : ts instanceof Date ? ts : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `${days} d`;
}

export default function MessageBubble(
  props: PropsWithChildren<{ role: 'user' | 'assistant'; testId?: string; createdAt?: string }>,
) {
  const { role, children, testId, createdAt } = props;
  const isUser = role === 'user';
  return (
    <div
      data-testid={testId}
      className={isUser ? 'self-end max-w-3xl' : 'self-start max-w-3xl'}
      aria-live="polite"
    >
      <div
        className={[
          'border border-border p-3 rounded-lg whitespace-pre-wrap',
          isUser ? 'bg-user' : 'bg-assistant',
        ].join(' ')}
      >
        {/* Mensaje */}
        {children}
        {/* Info de rol y timestamp abajo */}
        <div className="flex items-center justify-end mt-2">
          <span className="text-xs text-muted">
            {isUser ? 'Usuario' : 'Asistente'}
            {createdAt && <> · {formatRelative(createdAt)}</>}
          </span>
        </div>
      </div>
    </div>
  );
}