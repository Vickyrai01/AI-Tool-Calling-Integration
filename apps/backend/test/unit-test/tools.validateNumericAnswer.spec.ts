import { validateNumericAnswer } from '../../src/tools/validateNumericAnswer';

describe('validateNumericAnswer', () => {
  it('ok cuando coincide', () => {
    const res = validateNumericAnswer('2+2', '4');
    expect(res.ok).toBe(true);
  });
  it('falla con expresión inválida', () => {
    const res = validateNumericAnswer('2+', '4');
    expect(res.ok).toBe(false);
  });
});
