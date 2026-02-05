'use client';
import { useState } from 'react';
import type { ChatMeta } from '@/lib/types';

export default function DebugSidebar({ meta }: { meta?: ChatMeta }) {
  if (!meta) return null;
  const t = meta.timings || {};
  const tools = meta.tools || [];
  const tokens = meta.tokens || {};
  const [showInitialTokens, setShowInitialTokens] = useState(false);
  const [showFollowTokens, setShowFollowTokens] = useState(false);

  return (
    <aside className="w-96 border-l border-border bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="p-3">
        <div className="text-sm font-semibold mb-2">Debug</div>
        <div className="text-sm grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Fuente:</span>{' '}
            {meta.sourceUrl ? (
              <a className="text-primary hover:underline break-all" href={meta.sourceUrl} target="_blank" rel="noreferrer">
                {meta.sourceUrl}
              </a>
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>
          <div className="text-sm">
            <span className="font-medium">Timings:</span>{' '}
            <span className="text-muted">
              initial {t.initialMs ?? '—'}ms · followup {t.followupMs ?? '—'}ms
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Tokens: initial</div>
                <button className="text-xs text-primary hover:underline" onClick={() => setShowInitialTokens((v) => !v)}>
                  {showInitialTokens ? 'ocultar' : 'mostrar'}
                </button>
              </div>
              {showInitialTokens ? (
                <pre className="text-xs bg-bg border border-border rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                  {tokens.initial ? JSON.stringify(tokens.initial, null, 2) : '—'}
                </pre>
              ) : <div className="text-xs text-muted">oculto</div>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Tokens: followup</div>
                <button className="text-xs text-primary hover:underline" onClick={() => setShowFollowTokens((v) => !v)}>
                  {showFollowTokens ? 'ocultar' : 'mostrar'}
                </button>
              </div>
              {showFollowTokens ? (
                <pre className="text-xs bg-bg border border-border rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">
                  {tokens.followup ? JSON.stringify(tokens.followup, null, 2) : '—'}
                </pre>
              ) : <div className="text-xs text-muted">oculto</div>}
            </div>
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
                      <span className={ev.status === 'ok' ? 'text-green-700' : 'text-red-700'}>
                        {ev.status}
                      </span>
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
      </div>
    </aside>
  );
}