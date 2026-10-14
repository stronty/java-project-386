# AGENTS.md

Hexlet project: calendar/booking service. pnpm workspace with `backend/` (Fastify 5, TypeScript, ESM) and `frontend/` (Vite, React 19, Mantine 9). Everything is `"type": "module"`.

## Commands

- `pnpm install` (pnpm 11 per CI; `pnpm-workspace.yaml` allowlists esbuild build scripts)
- `pnpm dev` — runs both packages in parallel: backend :3000, frontend :5173
- `pnpm lint` (eslint at root, single flat config), `pnpm typecheck`, `pnpm test`, `pnpm build` — all fan out via `pnpm -r`
- `pnpm format` — prettier (single quotes, semi, trailing commas). `pnpm lint` already disables stylistic eslint rules, so don't hand-format.
- Single package: `pnpm --filter backend test` / `pnpm --filter frontend test`
- Single test: `pnpm --filter backend exec vitest run src/app.test.ts` (add `-t "name"` to filter). Note `vitest run`, not `vitest` — no watch mode in scripts.

## Architecture

- `backend/src/app.ts` exports `buildApp({ staticDir })`; `backend/src/server.ts` is the only entrypoint and reads `PORT` (default 3000, listens on `0.0.0.0`) and `STATIC_DIR`. When `STATIC_DIR` exists, @fastify/static serves it with an SPA fallback that returns `index.html` for non-`GET`/`/api` 404s.
- Backend compiles with `tsconfig.build.json` (`rootDir: src`, excludes `*.test.ts`) and emits ESM requiring explicit `.js` extensions in relative imports (NodeNext). `typecheck` uses the base tsconfig and does include tests.
- `frontend/src/main.tsx` mounts `App` under `MantineProvider` and `BrowserRouter`; entry HTML is `frontend/index.html`. Routes are real paths under react-router-dom (ADR 0008); `/` is the landing page and `/book` a placeholder.
- There is no API client and no vite dev proxy yet — the backend still only serves `/health`, with no `/api` route. When calls are added, the decided shape is a vite dev proxy forwarding `/api` to :3000 with a relative `/api` base URL, so client code is identical in dev and production (production is already served same-origin).
- The API contract is owned by a TypeSpec source; OpenAPI and the client SDK are generated from it by `pnpm generate`. Generated files are committed and never hand-edited — CI runs `pnpm generate` then `git diff --exit-code`. Server routes are hand-written Fastify over the generated schemas plus the generated `RouteHandlers` type: there is no TypeSpec→Fastify emitter.
- Production (Dockerfile) is a single container: `pnpm build`, then `node backend/dist/server.js` with `STATIC_DIR=/app/frontend/dist` and `PORT=8080`.

## Testing quirks

- Frontend Vitest uses jsdom + `src/test-setup.ts` (jest-dom, `cleanup`, and stubs for `matchMedia` / `ResizeObserver` that Mantine needs). Add browser API stubs there, not in individual tests.
- Backend tests use Fastify's `inject` — no listening port. Once persistence lands (ADR 0001), each test gets its own temp `DATA_DIR` so tests cannot see each other's SQLite file.
- Persistence is SQLite via `better-sqlite3` at `DATA_DIR`, schema created idempotently on boot (ADR 0001). Not implemented yet, and no fixtures or external services are configured.
- The API contract is generated from TypeSpec (see Architecture). Regenerate with `pnpm generate` after any contract change, and never edit a generated file by hand.

## Rules

- CI (`.github/workflows/ci.yml`, on every push) runs `pnpm lint && pnpm typecheck && pnpm test` with Node 22 — run all three before committing.
- Do not delete or edit `.github/workflows/hexlet-check.yml`; the grading harness depends on it.
- release-please runs on pushes to `main` and builds the changelog from Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), so use them.
- Do not commit secrets.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
