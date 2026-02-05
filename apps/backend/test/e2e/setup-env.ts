process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-openai-key';
process.env.SEED_OWNER = process.env.SEED_OWNER || 'owner';
process.env.SEED_REPO = process.env.SEED_REPO || 'repo';
process.env.SEED_PATH = process.env.SEED_PATH || 'dataset/seed.json';
process.env.FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
