import { z } from "zod";

export const GenerateExercisesRequestSchema = z.object({
  topic: z.enum([
    "ecuaciones_lineales",
    "ecuaciones_cuadraticas",
    "sistemas_2x2",
    "funciones_y_graficos",
  ]),
  difficulty: z.enum(["baja", "media", "alta"]),
  count: z.number().int().min(1).max(10).default(3),
});
