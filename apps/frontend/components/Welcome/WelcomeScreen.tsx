"use client";
import React from "react";

type Props = {
  onQuickAction: (text: string) => void;
  onStart: () => void; // NUEVO: CTA móvil
};

export default function WelcomeScreen({ onQuickAction, onStart }: Props) {
  const quickPrompts = [
    {
      label: "Ejercicio fácil",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad baja",
    },
    {
      label: "Ejercicio medio",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad media",
    },
    {
      label: "Ejercicio difícil",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad alta",
    },
    {
      label: "Intersección de rectas",
      text: "Generame 1 ejercicio de ecuaciones_lineales, dificultad alta donde me pidan hallar la intersección de L1 y L2",
    },
  ];

  return (
    <section
      className="min-h-[60vh] flex items-start justify-center px-4 pt-8"
      aria-label="Bienvenida"
    >
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-2xl lg:text-3xl font-bold m-0">
          ChatBot para ingreso UTN FRBA
        </h1>

        <p className="text-sm text-muted mt-3 leading-relaxed">
          Esta herramienta busca disminuir el desnivel al iniciar el ingreso a
          la UTN. En el aula, cada alumno practica ejercicios del mismo estilo
          que el parcial: quienes avanzan más pueden pedir desafíos de mayor
          dificultad y quienes necesitan afianzar contenidos pueden optar por
          ejercicios simples. El docente acompaña y aclara dudas sobre la
          resolución que devuelve el chatbot.
        </p>

        {/* CTA móvil: visible solo en celulares (lg:hidden) */}
        <div className="mt-4 lg:hidden">
          <button
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary w-full"
            onClick={onStart}
            aria-label="Crear nueva conversación"
          >
            Nueva conversación
          </button>
          <div className="text-[11px] text-muted mt-1">
            Abrí una conversación y empezá a chatear con el bot.
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-muted mb-2">Empezá con un ejemplo</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickPrompts.map((q) => (
              <button
                key={q.label}
                onClick={() => onQuickAction(q.text)}
                className="px-3 py-2 rounded-md border border-border bg-white text-sm hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={`Usar atajo: ${q.label}`}
                title={q.text}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-left mx-auto max-w-xl">
          <div className="text-sm font-semibold">Qué podés hacer</div>
          <ul className="mt-2 text-sm text-text list-disc pl-5">
            <li>Pedir ejercicios por tema y dificultad (baja, media, alta).</li>
            <li>Ver la respuesta final y los pasos de resolución.</li>
            <li>Solicitar variantes “similares” con números distintos.</li>
            <li>Consultar el historial de conversaciones.</li>
          </ul>
        </div>

        <div className="mt-4 text-xs text-muted">
          Cuando el bot usa ejemplos semilla, cita la fuente del dataset
          (GitHub).
        </div>
      </div>
    </section>
  );
}
