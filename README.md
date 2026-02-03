# AI Tool Calling Integration — Monorepo (Next.js + NestJS)

Bot de chat para generar ejercicios de matemática “estilo parcial de matematica y fisica del ingreso de la UTN frba”, con integración de OpenAI y una API externa (GitHub) para seed de ejemplos. Arquitectura separada: frontend en Vercel (Next.js) y backend en Render (NestJS + MongoDB).

- Frontend (Vercel): https://ai-tool-calling-integration.vercel.app
- Backend (Render): https://ai-tool-calling-integration.onrender.com

## Arquitectura

- apps/frontend: Next.js (App Router)
  - UI de chat, estados de carga/error
  - Consume el backend vía `NEXT_PUBLIC_API_URL`
- apps/backend: NestJS
  - Endpoints: `POST /chat` (dummy/tool-calling), `GET /conversations`, `GET /conversations/:id`, `POST /messages` (stubs)
  - CORS habilitado para el dominio de Vercel
  - Rate limiting básico en `/chat` (express-rate-limit)
  - Persistencia: MongoDB Atlas (Mongoose)
  - Integración OpenAI (SDK oficial)
  - API externa: GitHub Contents API para leer `dataset/seed.json`
- packages/shared: contratos y schemas con Zod (opcional)

## Stack

- Frontend: Next.js 16, TypeScript
- Backend: NestJS, TypeScript, Mongoose
- DB: MongoDB Atlas
- IA: OpenAI (Chat Completions / tool calling)
- API externa: GitHub Contents API
- Monorepo: pnpm workspaces

## Variables de entorno

Backend (apps/backend/.env):
- OPENAI_API_KEY=sk-...
- MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/ai_tool_calling
- FRONTEND_ORIGIN=https://ai-tool-calling-integration.vercel.app
- SEED_OWNER=Vickyrai01
- SEED_REPO=math-seed
- SEED_PATH=dataset/seed.json
- PORT=3001 (local; en Render usar PORT inyectado)

Frontend (apps/frontend/.env.local):
- NEXT_PUBLIC_API_URL=https://ai-tool-calling-integration.onrender.com

## Setup local

Requisitos:
- Node 18+
- pnpm 10+

Instalación y dev:
- pnpm install
- Configurar `.env` en apps/backend y `.env.local` en apps/frontend
- Levantar:
  - pnpm run dev:backend   # backend en 3001
  - pnpm run dev:frontend  # frontend en 3000
- Probar:
  - curl -X POST http://localhost:3001/chat -H "Content-Type: application/json" -d "{\"text\":\"hola\"}"

Notas workspace:
- pnpm-workspace.yaml solo en la raíz
- No tener `pnpm-lock.yaml` dentro de apps/* (solo en raíz)

## Endpoints (stubs Día 1)

- POST /chat
  - Request: `{ text: string }`
  - Response: `{ text: "Recibido: ..." }` o datos estructurados cuando se active tool calling
- GET /conversations
- GET /conversations/:id
- POST /messages

## Dataset semilla (GitHub API)

Repo: https://github.com/Vickyrai01/math-seed
Archivo: `dataset/seed.json`

Ejemplo de lectura:
```
curl -H "Accept: application/vnd.github.v3.raw" https://api.github.com/repos/Vickyrai01/math-seed/contents/dataset/seed.json
```

## Deploy

Frontend (Vercel):
- Root Directory: `apps/frontend`
- Env: `NEXT_PUBLIC_API_URL=https://ai-tool-calling-integration.onrender.com`

Backend (Render/Railway):
- Root Directory: `apps/backend`
- Install: `pnpm i`
- Build: `pnpm --filter @app/backend build`
- Start: `pnpm --filter @app/backend start:prod`
- Env: `OPENAI_API_KEY`, `MONGODB_URI`, `FRONTEND_ORIGIN`, `SEED_OWNER`, `SEED_REPO`, `SEED_PATH`
- PORT: usar el PORT inyectado por la plataforma (sin hardcodear)

## Checklist Día 1

- [x] Frontend y backend desplegados (hola mundo)
- [x] Comunicación verificada entre Vercel y Render
- [x] MongoDB Atlas conectado
- [x] Dataset semilla en GitHub accesible
- [x] .env.example en ambos
- [x] README inicial con arquitectura y setup

## Próximos pasos (Día 2)

- Orquestar OpenAI con tool calling:
  - Tool A: fetchSeedExamplesFromGitHub(topic, difficulty)
  - Tool B: validateNumericAnswer(userExpr, expectedExpr)
- Persistir Conversation/Message/Exercise en Mongo
- UI: render de ejercicios (enunciado, pasos, respuesta)
- Manejo de errores y timeouts