import { z } from 'zod';

const SeedExampleSchema = z.object({
  topic: z.string(),
  difficulty: z.string(),
  statement: z.string(),
  answer: z.string(),
});
export const SeedExamplesSchema = z.array(SeedExampleSchema);

export type SeedExample = z.infer<typeof SeedExampleSchema>;

type Params = {
  owner?: string; // por defecto usa SEED_OWNER
  repo?: string; // por defecto usa SEED_REPO
  path?: string; // por defecto usa SEED_PATH
  topic?: string; // ej: 'ecuaciones_lineales'
  difficulty?: string; // 'baja' | 'media' | 'alta'
  timeoutMs?: number; // default 10s
};

export async function fetchSeedExamplesFromGitHub(params: Params = {}) {
  const owner = params.owner ?? process.env.SEED_OWNER!;
  const repo = params.repo ?? process.env.SEED_REPO!;
  const path = params.path ?? process.env.SEED_PATH!;
  const topic = params.topic;
  const difficulty = params.difficulty;
  const timeoutMs = params.timeoutMs ?? 10_000;

  if (!owner || !repo || !path) {
    throw new Error('SEED_OWNER/SEED_REPO/SEED_PATH no configurados');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3.raw',
      },
    });

    if (res.status === 403 || res.status === 429) {
      throw new Error(`GitHub rate limit: ${res.status}`);
    }
    if (!res.ok) {
      throw new Error(`GitHub error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const parsed = SeedExamplesSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error('Seed examples invalid format');
    }

    let data = parsed.data;

    // Filtro por tema/dificultad si se especifica
    if (topic) data = data.filter((e) => e.topic === topic);
    if (difficulty) data = data.filter((e) => e.difficulty === difficulty);

    const sourceUrl = `https://github.com/${owner}/${repo}/blob/main/${path}`;
    return { examples: data, sourceUrl };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('GitHub fetch timeout');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
