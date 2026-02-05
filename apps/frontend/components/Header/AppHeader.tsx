"use client";
import { useState } from "react";
import QuickActionsMenu from "./QuickActionsMenu";

// Menú móvil (overlay) con acciones claras
function MobileHeaderMenu({
  open,
  onClose,
  onPrompt,
  onNewConversation,
  onOpenConversations,
  onToggleDebug,
  debugOn,
}: {
  open: boolean;
  onClose: () => void;
  onPrompt: (text: string) => void;
  onNewConversation: () => void;
  onOpenConversations: () => void;
  onToggleDebug: () => void;
  debugOn: boolean;
}) {
  if (!open) return null;

  const difficulty = [
    {
      label: "Baja (1)",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad baja",
    },
    {
      label: "Media (1)",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad media",
    },
    {
      label: "Alta (1)",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad alta",
    },
    {
      label: "Difíciles (2)",
      text: "Generame 2 ejercicios de ecuaciones_lineales, dificultad alta",
    },
  ];
  const templates = [
    {
      label: "Paralela",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad media donde me pidan encontrar la pendiente de una recta paralela",
    },
    {
      label: "Perpendicular",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad media donde me pidan encontrar la pendiente de una recta perpendicular",
    },
    {
      label: "Intersección",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad alta donde me pidan hallar la intersección de dos rectas",
    },
  ];

  function runPrompt(text: string) {
    onPrompt(text);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 bg-white rounded-b-xl shadow-xl border-b border-border p-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Menú</div>
          <button
            className="text-sm text-muted hover:text-text"
            onClick={onClose}
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="w-full px-3 py-3 rounded-md bg-primary text-white text-sm"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
          >
            Nueva conversación
          </button>

          <button
            className="w-full px-3 py-3 rounded-md border border-border bg-white text-sm"
            onClick={() => {
              onOpenConversations();
              onClose();
            }}
          >
            Conversaciones
          </button>

          <div className="border border-border rounded-md">
            <div className="px-3 py-2 text-xs text-muted uppercase">Atajos</div>
            <div className="px-2 pb-2 flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] text-muted uppercase">
                Dificultad
              </div>
              {difficulty.map((d) => (
                <button
                  key={d.label}
                  className="text-left px-2 py-2 rounded hover:bg-blue-50 text-sm"
                  onClick={() => runPrompt(d.text)}
                >
                  {d.label}
                </button>
              ))}
              <div className="px-2 py-1 text-[11px] text-muted uppercase mt-2">
                Plantillas
              </div>
              {templates.map((t) => (
                <button
                  key={t.label}
                  className="text-left px-2 py-2 rounded hover:bg-blue-50 text-sm"
                  onClick={() => runPrompt(t.text)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className={[
              "w-full px-3 py-3 rounded-md border text-sm",
              debugOn
                ? "border-primary text-primary bg-blue-50"
                : "border-border bg-white",
            ].join(" ")}
            onClick={() => {
              onToggleDebug();
              onClose();
            }}
            aria-pressed={debugOn}
          >
            {debugOn ? "Ocultar Debug" : "Mostrar Debug"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  onPrompt: (text: string) => void;
  onToggleDebug: () => void;
  debugOn: boolean;
  onNewConversation: () => void;
  onOpenConversations: () => void;
};

export default function AppHeader({
  onPrompt,
  onToggleDebug,
  debugOn,
  onNewConversation,
  onOpenConversations,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
      <div className="px-3 lg:px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Izquierda: móvil = hamburguesa; desktop = Nueva conversación */}
          <div className="flex items-center gap-2">
            {/* Hamburger solo mobile */}
            <button
              className="px-3 py-2 rounded-md border border-border bg-white hover:bg-blue-50 text-sm lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              ☰
            </button>

            {/* Desktop primary action */}
            <button
              className="hidden lg:inline-flex px-3 py-2 rounded-md bg-primary text-white text-sm hover:opacity-90"
              onClick={onNewConversation}
              aria-label="Nueva conversación"
            >
              Nueva conversación
            </button>
          </div>

          {/* Centro: título claro, no sobrecargado */}
          <div className="text-center">
            <div className="text-sm lg:text-base leading-tight font-semibold">
              ChatBot ingreso UTN FRBA
            </div>
            <div className="text-xs text-muted -mt-0.5">
              Ecuaciones lineales
            </div>
          </div>

          {/* Derecha: desktop = atajos + debug; mobile vacío (se usa menú) */}
          <div className="hidden lg:flex items-center gap-2">
            <QuickActionsMenu onPrompt={onPrompt} />
            <button
              className={[
                "px-3 py-2 rounded-md border text-sm",
                debugOn
                  ? "border-primary text-primary bg-blue-50"
                  : "border-border bg-white",
              ].join(" ")}
              onClick={onToggleDebug}
              aria-pressed={debugOn}
              aria-label="Mostrar/ocultar debug"
            >
              {debugOn ? "Ocultar Debug" : "Mostrar Debug"}
            </button>
          </div>
        </div>
      </div>

      {/* Menú overlay para móviles */}
      <MobileHeaderMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onPrompt={onPrompt}
        onNewConversation={onNewConversation}
        onOpenConversations={onOpenConversations}
        onToggleDebug={onToggleDebug}
        debugOn={debugOn}
      />
    </header>
  );
}
