# The API contract is TypeSpec, and generated files are committed

The booking app's API contract is owned by a single TypeSpec source. OpenAPI is generated from it,
and from that a client SDK for the frontend and the schemas and types for Fastify. One command runs
the whole thing, and generated files are never hand-edited.

We checked the ecosystem rather than assuming it, and the finding shaped the design: **there is no
TypeSpec-to-Fastify server emitter.** The old `typespec-service-emitter` is gone from npm, and its
first-party successor `@typespec/http-server-js` is an alpha self-described as highly experimental,
pinned to an older compiler, and bound to `node:http` and Express with no Fastify adapter. So "types,
request validation and route stubs" is two-thirds real: the supported shape is **hand-written Fastify
5 routes** over the generated OpenAPI schemas — which Fastify validates natively through its bundled
Ajv — plus the one thing the generator does give us, a `RouteHandlers` type. Anyone expecting
generated route stubs to fall out of the contract will not find them.

Generated files are **committed**. The deciding reason is that the drift check needs something to
diff: CI runs `pnpm generate` and then `git diff --exit-code`, which is only possible against
committed output. The price is review noise on generated diffs, and a hard requirement that the
generate command be **deterministic** — the same input must produce byte-identical output or CI fails
for reasons unrelated to the contract changing.

That requirement bites hardest on the client generator. `@hey-api/openapi-ts` is still the current
OpenAPI-to-TypeScript client generator and fits the frontend, but it describes itself as being in
initial development with breaking minor versions and has had no stable release since 0.99.0 in June
2026, with nightlies continuing unexplained through September. It is therefore pinned **exactly** in
the lockfile rather than with a caret range, and the drift check is what will catch it changing shape
underneath us.

## Consequences

CI runs the generate step on every push, not only when contract sources change, because a hand edit to
a generated file touches no contract source — the cheap path is the only one that catches the thing
the rule exists to catch. CI installs with `--frozen-lockfile`, so the generator's version is pinned
by the same lockfile that pins the rest of the toolchain and cannot drift between the local run that
produced a commit and the CI run that verifies it.

The contract is a hard dependency in both directions: the frontend SDK and the backend schemas are both
derived from it, so a contract change ripples to both at once. That is the point, but it means a
breaking contract change is a two-package change, not one.

The evidence behind all of this is in `docs/research/typescript-codegen-toolchain.md`, gathered against
primary sources. It flags three claims as warranting a spike before the pipeline is relied on.
