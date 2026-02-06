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
export const ExerciseSchema = z.object({
    id: z.string(),
    topic: z.string(),
    difficulty: z.string(),
    statement: z.string().min(10),
    steps: z.array(z.string()).min(1),
    answer: z.string().min(1),
    source: z.object({
        type: z.enum(["seed_examples_github", "model_generated"]),
        url: z.string().url().optional(),
    }),
});
export const GenerateExercisesResponseSchema = z.object({
    exercises: z.array(ExerciseSchema),
    guidance: z.string().optional(),
});
//# sourceMappingURL=intents.js.map