'use client';
import type { ChatMeta } from '@/lib/types';

export default function DebugPanel({ meta }: { meta?: ChatMeta }) {
  if (!meta) return null;
  const t = meta.timings || {};
  const tools = meta.tools || [];
  const tokens = meta.tokens || {};
  return (
    <div className="max-w-2xl mx-auto w-full my-2 p-3 border border-border rounded-md bg-white">
      <div className="text-sm font-semibold mb-2">Debug</div>

      <div className="text-sm grid grid-cols-1 gap-2">
        <div>
          <span className="font-medium">Fuente:</span>{' '}
          {meta.sourceUrl ? (
            <a className="text-primary hover:underline" href={meta.sourceUrl} target="_blank" rel="noreferrer">
              {meta.sourceUrl}
            </a>
          ) : (
            <span className="text-muted">—</span>
          )}
        </div>

        <div className="flex gap-4">
          <div>
            <span className="font-medium">Timings:</span>{' '}
            <span className="text-muted">
              initial {t.initialMs ?? '—'}ms · followup {t.followupMs ?? '—'}ms
            </span>
          </div>
          <div>
            <span className="font-medium">Tokens:</span>{' '}
            <span className="text-muted">
              init {tokens.initial ? JSON.stringify(tokens.initial) : '—'} · follow {tokens.followup ? JSON.stringify(tokens.followup) : '—'}
            </span>
          </div>
        </div>

        <div>
          <span className="font-medium">Tools:</span>
          <div className="mt-1 flex flex-col gap-1">
            {tools.length === 0 && <div className="text-muted">sin tools</div>}
            {tools.map((ev, i) => (
              <div key={i} className="text-xs border border-border rounded p-2 bg-bg">
                <div className="flex items-center justify-between">
                  <div>
                    <b>{ev.name}</b>{' '}
                    <span className={ev.status === 'ok' ? 'text-green-700' : 'text-red-700'}>
                      {ev.status}
                    </span>
                  </div>
                  <div className="text-muted">{typeof ev.ms === 'number' ? `${ev.ms}ms` : ''}</div>
                </div>
                {ev.summary && <div className="mt-1">{ev.summary}</div>}
                {ev.args && (
                  <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(ev.args)}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}