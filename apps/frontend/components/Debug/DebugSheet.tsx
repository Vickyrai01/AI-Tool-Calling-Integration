'use client';
import { useState } from 'react';
import type { ChatMeta } from '@/lib/types';

type Props = { open: boolean; onClose: () => void; meta?: ChatMeta };

export default function DebugSheet({ open, onClose, meta }: Props) {
  const t = meta?.timings || {};
  const tools = meta?.tools || [];
  const tokens = meta?.tokens || {};
  const [showInit, setShowInit] = useState(false);
  const [showFollow, setShowFollow] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-border rounded-t-lg shadow-xl p-3 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Debug</div>
          <button className="text-sm text-muted hover:text-text" onClick={onClose} aria-label="Cerrar">Cerrar</button>
        </div>

        {!meta && (
          <div className="text-xs text-muted">
            Debug activo. Enviá un mensaje para ver tools, tiempos y tokens aquí.
          </div>
        )}

        {meta && (
          <div className="text-sm grid grid-cols-1 gap-3">
            <div>
              <span className="font-medium">Fuente:</span>{' '}
              {meta?.sourceUrl ? (
                <a className="text-primary hover:underline break-all" href={meta.sourceUrl} target="_blank" rel="noreferrer">
                  {meta.sourceUrl}
                </a>
              ) : <span className="text-muted">—</span>}
            </div>

            <div>
              <span className="font-medium">Timings:</span>{' '}
              <span className="text-muted">initial {t.initialMs ?? '—'}ms · followup {t.followupMs ?? '—'}ms</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Tokens: initial</div>
                <button className="text-xs text-primary hover:underline" onClick={() => setShowInit((v) => !v)}>
                  {showInit ? 'ocultar' : 'mostrar'}
                </button>
              </div>
              {showInit ? (
                <pre className="text-xs bg-bg border border-border rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                  {tokens.initial ? JSON.stringify(tokens.initial, null, 2) : '—'}
                </pre>
              ) : <div className="text-xs text-muted">oculto</div>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Tokens: followup</div>
                <button className="text-xs text-primary hover:underline" onClick={() => setShowFollow((v) => !v)}>
                  {showFollow ? 'ocultar' : 'mostrar'}
                </button>
              </div>
              {showFollow ? (
                <pre className="text-xs bg-bg border border-border rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                  {tokens.followup ? JSON.stringify(tokens.followup, null, 2) : '—'}
                </pre>
              ) : <div className="text-xs text-muted">oculto</div>}
            </div>

            <div>
              <div className="font-medium mb-1">Tools</div>
              <div className="flex flex-col gap-2">
                {tools.length === 0 && <div className="text-muted text-sm">sin tools</div>}
                {tools.map((ev, i) => (
                  <div key={i} className="border border-border rounded-md p-2 bg-bg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <b className="mr-1">{ev.name}</b>
                        <span className={ev.status === 'ok' ? 'text-green-700' : 'text-red-700'}>{ev.status}</span>
                      </div>
                      <div className="text-xs text-muted">{typeof ev.ms === 'number' ? `${ev.ms}ms` : ''}</div>
                    </div>
                    {ev.summary && <div className="text-xs mt-1">{ev.summary}</div>}
                    {ev.args && (
                      <pre className="text-xs mt-1 bg-white border border-border rounded p-2 whitespace-pre-wrap break-words max-h-32 overflow-auto">
                        {JSON.stringify(ev.args, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}