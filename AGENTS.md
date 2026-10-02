# AGENTS.md

Booking app (calendar scheduling). pnpm workspace: `backend/` (Fastify, TypeScript) and `frontend/` (Vite, React, TypeScript, Mantine).

## Commands

- Install: `pnpm install`
- Run both apps: `pnpm dev` (backend on :3000, frontend on :5173)
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test` (Vitest in both packages)
- Build: `pnpm build`

## Structure

- `backend/src/app.ts` builds the Fastify app, `server.ts` starts it. The port comes from the `PORT` env variable (default 3000).
- `frontend/src` is the React app. Tests sit next to the code as `*.test.ts(x)`.

## Rules

- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). release-please builds the changelog from them.
- Run `pnpm lint && pnpm typecheck && pnpm test` before committing.
- Do not commit secrets.
