'use client';
import { useState } from 'react';
import type { Exercise } from '@/lib/types';

export default function ExerciseCard({
  ex,
  onRegenerate,
  compact = false,
}: { ex: Exercise; onRegenerate?: (ex: Exercise) => void; compact?: boolean }) {
  // Por defecto NO mostrar los pasos
  const [showSteps, setShowSteps] = useState(false);

  async function copyAnswer() {
    try { await navigator.clipboard.writeText(ex.answer); } catch {}
  }

  return (
    <div className={['border border-border rounded-lg bg-white', compact ? 'p-2' : 'p-3 shadow-sm'].join(' ')}>
      <div className="flex items-center justify-between mb-1">
        <strong className={compact ? 'text-sm' : ''}>{ex.topic} · {ex.difficulty}</strong>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => onRegenerate(ex)}
              title="Generar otro similar"
            >
              regenerar similar
            </button>
          )}
          <button
            className="text-xs text-primary hover:underline"
            onClick={copyAnswer}
            title="Copiar respuesta"
          >
            copiar respuesta
          </button>
          {ex.sourceUrl && (
            <a href={ex.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              fuente
            </a>
          )}
        </div>
      </div>

      <div className={compact ? 'mb-1 text-sm' : 'mb-2'}>{ex.statement}</div>

      <div className={compact ? 'text-xs' : 'text-sm'}>
        {/* Toggle SOLO para pasos; por defecto ocultos */}
        <button
          className="text-xs text-muted hover:text-text mb-1"
          onClick={() => setShowSteps((v) => !v)}
          aria-expanded={showSteps}
        >
          {showSteps ? 'ocultar pasos' : 'mostrar pasos'}
        </button>

        {showSteps && (
          <>
            <div className="font-semibold my-1">Pasos</div>
            <ol className={compact ? 'm-0 pl-4 list-decimal' : 'm-0 pl-5 list-decimal'}>
              {ex.steps.map((s, idx) => <li key={idx}>{s}</li>)}
            </ol>
          </>
        )}

        {/* La respuesta se muestra SIEMPRE, sin opción de ocultar */}
        <div className="font-semibold my-1">Respuesta</div>
        <div>{ex.answer}</div>
      </div>
    </div>
  );
}