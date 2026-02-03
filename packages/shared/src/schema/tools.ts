import { z } from "zod";

export const ValidateNumericAnswerResultSchema = z.object({
  ok: z.boolean(),
  user: z.any().optional(),
  expected: z.any().optional(),
  error: z.string().optional(),
});
