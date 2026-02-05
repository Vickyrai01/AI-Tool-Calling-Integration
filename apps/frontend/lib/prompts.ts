export function buildPrompt(params: {
  topic?: string;
  difficulty?: "baja" | "media" | "alta";
  count?: number;
  variant?: "paralela" | "perpendicular" | "interseccion";
}) {
  const topic = params.topic ?? "ecuaciones_lineales";
  const diff = params.difficulty ?? "media";
  const count = params.count ?? 1;
  const base = `Generame ${count} ejercicio${count > 1 ? "s" : ""} de ${topic}, dificultad ${diff}`;
  if (params.variant === "paralela")
    return `${base} donde me pidan encontrar la pendiente de una recta paralela`;
  if (params.variant === "perpendicular")
    return `${base} donde me pidan encontrar la pendiente de una recta perpendicular`;
  if (params.variant === "interseccion")
    return `${base} donde me pidan hallar la intersección de dos rectas`;
  return base;
}
