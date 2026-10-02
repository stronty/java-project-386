# AGENTS.md

Hexlet project: calendar/booking service. pnpm workspace with `backend/` (Fastify 5, TypeScript, ESM) and `frontend/` (Vite, React 19, Mantine 9). Everything is `"type": "module"`.

## Commands

- `pnpm install` (pnpm 10 per CI; `pnpm-workspace.yaml` allowlists esbuild build scripts)
- `pnpm dev` — runs both packages in parallel: backend :3000, frontend :5173
- `pnpm lint` (eslint at root, single flat config), `pnpm typecheck`, `pnpm test`, `pnpm build` — all fan out via `pnpm -r`
- `pnpm format` — prettier (single quotes, semi, trailing commas). `pnpm lint` already disables stylistic eslint rules, so don't hand-format.
- Single package: `pnpm --filter backend test` / `pnpm --filter frontend test`
- Single test: `pnpm --filter backend exec vitest run src/app.test.ts` (add `-t "name"` to filter). Note `vitest run`, not `vitest` — no watch mode in scripts.

## Architecture

- `backend/src/app.ts` exports `buildApp({ staticDir })`; `backend/src/server.ts` is the only entrypoint and reads `PORT` (default 3000, listens on `0.0.0.0`) and `STATIC_DIR`. When `STATIC_DIR` exists, @fastify/static serves it with an SPA fallback that returns `index.html` for non-`GET`/`/api` 404s.
- Backend compiles with `tsconfig.build.json` (`rootDir: src`, excludes `*.test.ts`) and emits ESM requiring explicit `.js` extensions in relative imports (NodeNext). `typecheck` uses the base tsconfig and does include tests.
- `frontend/src/main.tsx` mounts `App` under `MantineProvider`; entry HTML is `frontend/index.html`.
- There is no API client, no vite dev proxy, and no `/api` route yet — the backend only serves `/health`. Frontend talks to nothing yet; wire up a proxy/base URL explicitly if you add calls.
- Production (Dockerfile) is a single container: `pnpm build`, then `node backend/dist/server.js` with `STATIC_DIR=/app/frontend/dist` and `PORT=8080`.

## Testing quirks

- Frontend Vitest uses jsdom + `src/test-setup.ts` (jest-dom, `cleanup`, and stubs for `matchMedia` / `ResizeObserver` that Mantine needs). Add browser API stubs there, not in individual tests.
- Backend tests use Fastify's `inject`, no listening port or DB.
- No database, fixtures, or external services are configured yet.

## Rules

- CI (`.github/workflows/ci.yml`, on every push) runs `pnpm lint && pnpm typecheck && pnpm test` with Node 22 — run all three before committing.
- Do not delete or edit `.github/workflows/hexlet-check.yml`; the grading harness depends on it.
- release-please runs on pushes to `main` and builds the changelog from Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), so use them.
- Do not commit secrets.
