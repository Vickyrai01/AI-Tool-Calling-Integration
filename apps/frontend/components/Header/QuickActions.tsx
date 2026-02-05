"use client";
type Props = {
  onPrompt: (text: string) => void;
  onToggleDebug?: () => void;
  debugOn?: boolean;
};
export default function QuickActions({
  onPrompt,
  onToggleDebug,
  debugOn,
}: Props) {
  const actions = [
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
    {
      label: "Difíciles (2)",
      text: "Generame 2 ejercicios de ecuaciones_lineales, dificultad alta",
    },
  ];
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            className="px-3 py-1 rounded-md border border-border bg-white hover:bg-blue-50 text-sm"
            onClick={() => onPrompt(a.text)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button
        className={[
          "px-3 py-1 rounded-md border text-sm",
          debugOn
            ? "border-primary text-primary bg-blue-50"
            : "border-border bg-white",
        ].join(" ")}
        onClick={onToggleDebug}
        title="Mostrar/ocultar debug"
      >
        {debugOn ? "Ocultar Debug" : "Mostrar Debug"}
      </button>
    </div>
  );
}
