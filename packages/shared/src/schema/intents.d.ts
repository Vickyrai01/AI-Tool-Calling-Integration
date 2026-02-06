import { z } from "zod";
export declare const GenerateExercisesRequestSchema: z.ZodObject<{
    topic: z.ZodEnum<["ecuaciones_lineales", "ecuaciones_cuadraticas", "sistemas_2x2", "funciones_y_graficos"]>;
    difficulty: z.ZodEnum<["baja", "media", "alta"]>;
    count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    topic: "ecuaciones_lineales" | "ecuaciones_cuadraticas" | "sistemas_2x2" | "funciones_y_graficos";
    difficulty: "media" | "baja" | "alta";
    count: number;
}, {
    topic: "ecuaciones_lineales" | "ecuaciones_cuadraticas" | "sistemas_2x2" | "funciones_y_graficos";
    difficulty: "media" | "baja" | "alta";
    count?: number | undefined;
}>;
export declare const ExerciseSchema: z.ZodObject<{
    id: z.ZodString;
    topic: z.ZodString;
    difficulty: z.ZodString;
    statement: z.ZodString;
    steps: z.ZodArray<z.ZodString, "many">;
    answer: z.ZodString;
    source: z.ZodObject<{
        type: z.ZodEnum<["seed_examples_github", "model_generated"]>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "model_generated" | "seed_examples_github";
        url?: string | undefined;
    }, {
        type: "model_generated" | "seed_examples_github";
        url?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    topic: string;
    difficulty: string;
    statement: string;
    answer: string;
    id: string;
    steps: string[];
    source: {
        type: "model_generated" | "seed_examples_github";
        url?: string | undefined;
    };
}, {
    topic: string;
    difficulty: string;
    statement: string;
    answer: string;
    id: string;
    steps: string[];
    source: {
        type: "model_generated" | "seed_examples_github";
        url?: string | undefined;
    };
}>;
export declare const GenerateExercisesResponseSchema: z.ZodObject<{
    exercises: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        topic: z.ZodString;
        difficulty: z.ZodString;
        statement: z.ZodString;
        steps: z.ZodArray<z.ZodString, "many">;
        answer: z.ZodString;
        source: z.ZodObject<{
            type: z.ZodEnum<["seed_examples_github", "model_generated"]>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "model_generated" | "seed_examples_github";
            url?: string | undefined;
        }, {
            type: "model_generated" | "seed_examples_github";
            url?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        topic: string;
        difficulty: string;
        statement: string;
        answer: string;
        id: string;
        steps: string[];
        source: {
            type: "model_generated" | "seed_examples_github";
            url?: string | undefined;
        };
    }, {
        topic: string;
        difficulty: string;
        statement: string;
        answer: string;
        id: string;
        steps: string[];
        source: {
            type: "model_generated" | "seed_examples_github";
            url?: string | undefined;
        };
    }>, "many">;
    guidance: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    exercises: {
        topic: string;
        difficulty: string;
        statement: string;
        answer: string;
        id: string;
        steps: string[];
        source: {
            type: "model_generated" | "seed_examples_github";
            url?: string | undefined;
        };
    }[];
    guidance?: string | undefined;
}, {
    exercises: {
        topic: string;
        difficulty: string;
        statement: string;
        answer: string;
        id: string;
        steps: string[];
        source: {
            type: "model_generated" | "seed_examples_github";
            url?: string | undefined;
        };
    }[];
    guidance?: string | undefined;
}>;
