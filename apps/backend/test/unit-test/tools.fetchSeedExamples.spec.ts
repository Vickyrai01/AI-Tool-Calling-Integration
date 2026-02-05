import { fetchSeedExamplesFromGitHub } from '../../src/tools/fetchSeedExamples';

describe('fetchSeedExamplesFromGitHub', () => {
  const owner = 'owner';
  const repo = 'repo';
  const path = 'dataset/seed.json';

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });

  it('filtra por topic/difficulty y valida formato', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          topic: 'ecuaciones_lineales',
          difficulty: 'alta',
          statement: '...',
          answer: '...',
        },
        {
          topic: 'sistemas_2x2',
          difficulty: 'media',
          statement: '...',
          answer: '...',
        },
      ],
    });
    const { examples, sourceUrl } = await fetchSeedExamplesFromGitHub({
      owner,
      repo,
      path,
      topic: 'ecuaciones_lineales',
      difficulty: 'alta',
    });
    expect(examples).toHaveLength(1);
    expect(sourceUrl).toContain('/blob/main/dataset/seed.json');
  });

  it('maneja rate limit', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({}),
    });
    await expect(
      fetchSeedExamplesFromGitHub({ owner, repo, path }),
    ).rejects.toThrow(/rate limit/i);
  });
});
