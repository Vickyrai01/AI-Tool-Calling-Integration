"use client";
import React from "react";
import type { ChatMeta } from "@/lib/types";

export default function DebugSidebar({ meta }: { meta?: ChatMeta }) {
  return (
    <aside
      className="w-96 shrink-0 h-full border-l border-border bg-white overflow-y-auto"
      aria-label="Panel de debug"
    >
      <div className="p-3 border-b border-border">
        <div className="text-sm font-semibold">Debug</div>
        <div className="text-xs text-muted">Tools, tokens y tiempos</div>
      </div>

      {!meta && (
        <div className="p-3">
          <div className="text-sm">Debug activo</div>
          <p className="text-xs text-muted mt-1">
            Enviá un mensaje para ver herramientas invocadas, tiempos y tokens.
            Este panel permanece visible para mantener consistencia del layout.
          </p>
          <ul className="text-xs list-disc pl-5 mt-2 text-muted">
            <li>
              Fuente (GitHub) se mostrará cuando el bot use el dataset semilla.
            </li>
            <li>
              Timings aparecen tras la primera respuesta (initial y followup).
            </li>
            <li>Tokens y tools se listan por cada turno.</li>
          </ul>
        </div>
      )}

      {meta && (
        <div className="p-3 text-sm">
          <div className="mb-3">
            <span className="font-medium">Fuente:</span>{" "}
            {meta.sourceUrl ? (
              <a
                className="text-primary hover:underline break-all"
                href={meta.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {meta.sourceUrl}
              </a>
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>

          <div className="mb-3">
            <span className="font-medium">Timings:</span>{" "}
            <span className="text-muted">
              initial {meta.timings?.initialMs ?? "—"}ms · followup{" "}
              {meta.timings?.followupMs ?? "—"}ms
            </span>
          </div>

          <div className="mb-3">
            <div className="font-medium mb-1">Tools</div>
            <div className="flex flex-col gap-2">
              {!meta.tools || meta.tools.length === 0 ? (
                <div className="text-xs text-muted">
                  sin tools en este turno
                </div>
              ) : (
                meta.tools.map((ev, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-md p-2 bg-bg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <b className="mr-1">{ev.name}</b>
                        <span
                          className={
                            ev.status === "ok"
                              ? "text-green-700"
                              : "text-red-700"
                          }
                        >
                          {ev.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {typeof ev.ms === "number" ? `${ev.ms}ms` : ""}
                      </div>
                    </div>
                    {ev.summary && (
                      <div className="text-xs mt-1">{ev.summary}</div>
                    )}
                    {ev.args && (
                      <pre className="text-xs mt-1 bg-white border border-border rounded p-2 whitespace-pre-wrap break-words max-h-32 overflow-auto">
                        {JSON.stringify(ev.args, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="font-medium">Tokens (última respuesta)</div>
            <pre className="text-xs bg-white border border-border rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto">
              {JSON.stringify(meta.tokens ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </aside>
  );
}
