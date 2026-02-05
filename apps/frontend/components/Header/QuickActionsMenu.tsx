'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
  onPrompt: (text: string) => void;
};

export default function QuickActionsMenu({ onPrompt }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const difficulty = [
    { label: 'Baja (1)', text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad baja' },
    { label: 'Media (1)', text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad media' },
    { label: 'Alta (1)', text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad alta' },
    { label: 'Difíciles (2)', text: 'Generame 2 ejercicios de ecuaciones_lineales, dificultad alta' },
  ];

  const templates = [
    { label: 'Paralela', text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad media donde me pidan encontrar la pendiente de una recta paralela' },
    { label: 'Perpendicular', text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad media donde me pidan encontrar la pendiente de una recta perpendicular' },
    { label: 'Intersección', text: 'Generame 1 ejercicio de ecuaciones_lineales, dificultad alta donde me pidan hallar la intersección de dos rectas' },
  ];

  function run(text: string) {
    onPrompt(text);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="px-3 py-2 rounded-md border border-border bg-white hover:bg-blue-50 text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir atajos"
      >
        Atajos
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-md border border-border bg-white shadow-lg z-30 p-2"
        >
          <div className="px-2 py-1 text-xs text-muted uppercase">Dificultad</div>
          <div className="flex flex-col gap-1 mb-2">
            {difficulty.map((d) => (
              <button
                key={d.label}
                className="text-left px-2 py-1 rounded hover:bg-blue-50 text-sm"
                onClick={() => run(d.text)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="px-2 py-1 text-xs text-muted uppercase">Plantillas</div>
          <div className="flex flex-col gap-1">
            {templates.map((t) => (
              <button
                key={t.label}
                className="text-left px-2 py-1 rounded hover:bg-blue-50 text-sm"
                onClick={() => run(t.text)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}