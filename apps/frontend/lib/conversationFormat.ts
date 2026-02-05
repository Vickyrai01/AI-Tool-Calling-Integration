export function sanitizePreview(text: string): string {
  const raw = String(text || "").trim();
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.exercises)) {
      const n = obj.exercises.length;
      const first = obj.exercises?.[0] || {};
      const topic = first?.topic ? String(first.topic) : "";
      const diff = first?.difficulty ? String(first.difficulty) : "";
      const parts = [`${n} ejercicio${n > 1 ? "s" : ""}`];
      if (topic) parts.push(topic);
      if (diff) parts.push(diff);
      return parts.join(" · ").slice(0, 90);
    }
  } catch {
    // no es JSON
  }
  return raw.replace(/\s+/g, " ").slice(0, 90);
}

export function deriveTitle(title?: string, fallback?: string): string {
  const t = String(title || "").trim();
  const lowered = t.toLowerCase();
  if (
    t &&
    lowered !== "nueva conversación" &&
    lowered !== "nueva conversacion"
  ) {
    return t.slice(0, 40);
  }
  // Si el título es default, usamos el fallback saneado (primer mensaje o preview)
  const f = sanitizePreview(String(fallback || ""));
  return f || "Conversación";
}

export function formatRelative(ts?: string | number | Date) {
  if (!ts) return "";
  const d =
    typeof ts === "string"
      ? new Date(ts)
      : ts instanceof Date
        ? ts
        : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `${days} d`;
}
