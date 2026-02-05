const API = process.env.NEXT_PUBLIC_API_URL;

function ensureApi() {
  if (!API) throw new Error('NEXT_PUBLIC_API_URL no está definido');
  return API!;
}

async function readBody(res: Response) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

export async function listConversations() {
  const base = ensureApi();
  const res = await fetch(`${base}/conversations`, { cache: 'no-store', credentials: 'include' });
  const { json, raw } = await readBody(res);
  if (!res.ok) throw new Error(`GET /conversations ${res.status}: ${raw.slice(0,200)}`);
  return json as any[];
}

export async function getConversation(id: string) {
  const base = ensureApi();
  const res = await fetch(`${base}/conversations/${id}`, { cache: 'no-store', credentials: 'include' });
  const { json, raw } = await readBody(res);
  if (!res.ok) throw new Error(`GET /conversations/${id} ${res.status}: ${raw.slice(0,200)}`);
  return json as any;
}

export async function postChat(params: { text: string; conversationId?: string }) {
  const base = ensureApi();
  const res = await fetch(`${base}/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const { json, raw } = await readBody(res);
  if (!res.ok) throw new Error(`POST /chat ${res.status}: ${raw.slice(0,200)}`);
  return json as any;
}