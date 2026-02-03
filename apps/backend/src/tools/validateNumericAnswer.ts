import { create, all } from 'mathjs';

const math = create(all, {});

/**
 * Valida si dos expresiones numéricas son equivalentes.
 * - Evalúa userExpr y expectedExpr (ej.: "2+2" vs "4", "3/2" vs "1.5").
 * - Retorna ok=true si son iguales.
 */
export function validateNumericAnswer(userExpr: string, expectedExpr: string) {
  try {
    const user = math.evaluate(userExpr);
    const expected = math.evaluate(expectedExpr);
    const ok = math.equal(user, expected);
    return { ok: !!ok, user, expected };
  } catch (e) {
    return { ok: false, error: 'Invalid expression' };
  }
}
