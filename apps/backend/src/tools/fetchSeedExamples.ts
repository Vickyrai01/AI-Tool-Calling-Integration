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
  owner?: string;
  repo?: string;
  path?: string;
  topic?: string;
  difficulty?: string;
  timeoutMs?: number;
  excludeStatements?: string[];
  excludeAnswers?: string[];
  excludePairs?: string[];   // NUEVO: excluir "statement|answer" ya enviados en este turno
  sampleCount?: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairKey(s: string, a: string) {
  return `${String(s).trim()}|${String(a).trim()}`;
}

export async function fetchSeedExamplesFromGitHub(params: Params = {}) {
  const owner = params.owner ?? process.env.SEED_OWNER!;
  const repo = params.repo ?? process.env.SEED_REPO!;
  const path = params.path ?? process.env.SEED_PATH!;
  const { topic, difficulty, excludeStatements, excludeAnswers, excludePairs } = params;
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
      headers: { Accept: 'application/vnd.github.v3.raw' },
    });

    if (res.status === 403 || res.status === 429) throw new Error(`GitHub rate limit: ${res.status}`);
    if (!res.ok) throw new Error(`GitHub error: ${res.status} ${res.statusText}`);

    const json = await res.json();
    const parsed = SeedExamplesSchema.safeParse(json);
    if (!parsed.success) throw new Error('Seed examples invalid format');

    let data = parsed.data;

    if (topic) data = data.filter((e) => e.topic === topic);
    if (difficulty) data = data.filter((e) => e.difficulty === difficulty);

    if (excludeStatements?.length) {
      const set = new Set(excludeStatements.map((s) => String(s).trim()));
      data = data.filter((e) => !set.has(String(e.statement).trim()));
    }
    if (excludeAnswers?.length) {
      const set = new Set(excludeAnswers.map((a) => String(a).trim()));
      data = data.filter((e) => !set.has(String(e.answer).trim()));
    }
    if (excludePairs?.length) {
      const set = new Set(excludePairs.map(String));
      data = data.filter((e) => !set.has(pairKey(e.statement, e.answer)));
    }

    const sampleCount = params.sampleCount ?? 0;
    if (sampleCount > 0) {
      data = shuffle(data).slice(0, sampleCount);
    }

    const sourceUrl = `https://github.com/${owner}/${repo}/blob/main/${path}`;
    return { examples: data, sourceUrl };
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('GitHub fetch timeout');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}