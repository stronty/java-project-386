# Research: the current TypeSpec codegen toolchain

Resolves [#8](https://github.com/stronty/java-project-386/issues/8). Written 2026-10-14.

**Convention note.** This repo had no research convention — `docs/` contained only `adr/` and
`agents/`. `docs/research/` is created by this file: one Markdown document per research question,
named after the question, headed with the issue it resolves and the date it was checked. Every
substantive claim carries the URL of the primary source it came from; registry facts were read from
the npm registry API (`https://registry.npmjs.org/<package>`) and from the packages' own published
tarballs, not from memory.

**Scope.** Findings only. Where generated files live, how CI detects drift, and how the Dockerfile
runs codegen are a separate grilling ticket and are deliberately *not* decided here.

---

## 1. TypeSpec: current state

| Fact | Value | Source |
| --- | --- | --- |
| Compiler | `@typespec/compiler` **1.17.0**, published 2026-10-08 | [release](https://github.com/microsoft/typespec/releases/tag/typespec-stable%401.17.0), [registry](https://registry.npmjs.org/@typespec/compiler) |
| Stable version | 1.17.0, `next` = `1.18.0-dev.3` | [registry](https://registry.npmjs.org/@typespec/compiler) |
| Node requirement | `>=22.0.0` | [registry](https://registry.npmjs.org/@typespec/compiler) |
| OpenAPI emitter | `@typespec/openapi3` **1.17.0** (emits OpenAPI **3.0.0, 3.1.0 and 3.2.0**) | [registry](https://registry.npmjs.org/@typespec/openapi3), [emitter README](https://github.com/microsoft/typespec/blob/main/packages/openapi3/README.md) |
| Companion library | `@typespec/openapi` 1.17.0 (concepts + decorators, no output of its own) | [registry](https://registry.npmjs.org/@typespec/openapi) |
| Docs site | Confirms "Version 1.17.0 is now available" | [typespec.io](https://typespec.io/docs/) |

**Actively developed: unambiguously yes.** 1.17.0 shipped six days before this check with changes
across the compiler, `@typespec/http`, `@typespec/openapi`, `@typespec/openapi3` and
`@typespec/json-schema` ([release notes](https://github.com/microsoft/typespec/releases/tag/typespec-stable%401.17.0)).
The monorepo has ~1000 open issues and active PRs ([repo](https://github.com/microsoft/typespec)).

**Is `@typespec/openapi3` still the OpenAPI emitter?** Yes, and it is the only first-party one.
`openapi-versions` accepts `"3.0.0" | "3.1.0" | "3.2.0"` and **defaults to `["3.0.0"]`**
([emitter options](https://github.com/microsoft/typespec/blob/main/packages/openapi3/README.md#openapi-versions)).
The package description is "emitting OpenAPI 3.0 and OpenAPI 3.1" while the options accept 3.2 —
minor doc drift inside the same README, worth knowing but not load-bearing.

There is no "OpenAPI 4" emitter and no announced successor. Note that `@typespec/asset-emitter` is
described in its own registry description as "to be replaced by the new emitter framework" — that is
about the *emitter SDK*, not about the OpenAPI output format ([registry](https://registry.npmjs.org/@typespec/asset-emitter)).

**Non-OpenAPI first-party emitters** relevant as alternatives: `@typespec/json-schema` 1.17.0,
`@typespec/protobuf` 0.87.0, `@typespec/xml` 0.87.0, `@typespec/graphql` 0.4.0,
`@typespec/http-client-js` 0.16.3 ([registry search](https://registry.npmjs.org/-/v1/search?text=keywords:typespec&size=60)).

### The "server" / service emitter

This is the part that has moved most, and it is worth being precise:

- **`typespec-service-emitter` no longer exists.** The package name 404s on npm
  ([registry](https://registry.npmjs.org/typespec-service-emitter)); the same is true of
  `@typespec/service-emitter` ([registry](https://registry.npmjs.org/@typespec/service-emitter)).
  Anything written against it is dead.
- **Its successor is `@typespec/http-server-js`, currently `0.58.0-alpha.29` (published
  2026-09-09), and its own README opens with: "⚠️ This package is highly experimental and may be
  subject to breaking changes and bugs."** ([README](https://github.com/microsoft/typespec/blob/main/packages/http-server-js/README.md),
  [registry](https://registry.npmjs.org/@typespec/http-server-js)).
  It lives in the first-party monorepo, so its long-term direction matters to us even though it is
  not usable as-is.
- **What it generates:** a `createXxxRouter()` per service, service **interfaces** you implement, TS
  models, and per-operation functions that deserialize/validate the request and write the response.
  ([README, "Functionality and generated code"](https://github.com/microsoft/typespec/blob/main/packages/http-server-js/README.md#functionality-and-generated-code))
- **What it binds to: `node:http` or Express.** The Fastify hook is `expressMiddleware`, not
  `fastify`. ([same README](https://github.com/microsoft/typespec/blob/main/packages/http-server-js/README.md#express))
  There is no Fastify adapter and no adapter plugin. For a repo whose server *is* Fastify 5 with
  `buildApp()` already written, adopting it means replacing the HTTP layer.
- Its peer range is `^1.16.0` against compiler/openapi3 while the current compiler is 1.17.0 —
  another reason to treat it as moving ([registry](https://registry.npmjs.org/@typespec/http-server-js)).

**Verdict for us: there is no first-party TypeSpec→Fastify server emitter. Not in beta, not
experimental, not aspirational — absent.** Everything else below is a workaround.

---

## 2. Fastify integration: what actually works today

### 2a. `@hey-api/openapi-ts`'s Fastify plugin — real, but much smaller than advertised

A Fastify plugin does exist and is listed in the official plugin ecosystem
([heyapi.dev](https://heyapi.dev/docs/openapi/typescript/core)). Its docs page
([plugins/fastify](https://heyapi.dev/docs/openapi/typescript/plugins/fastify)) is labelled
**Beta** and claims it generates "route handlers", showing:

```ts
const fastify = Fastify();
const serviceHandlers: RouteHandlers = { /* … */ };
fastify.register(glue, { serviceHandlers });
```

**That example is not what the plugin generates.** Two independent checks:

1. Reading the plugin's own shipped implementation — its config declares one artifact and one node:
   `dependencies: ["@hey-api/typescript"]`, `name: "fastify"`, and the handler builds a single
   exported alias `RouteHandlers` whose properties are `RouteHandler<{Body, Headers, Params,
   Querystring, Reply}>` per operation. ([tarball of
   `@hey-api/openapi-ts@0.99.0`, `dist/init-D6Y8JFUS.mjs`, regions `src/plugins/fastify/*`](https://registry.npmjs.org/@hey-api/openapi-ts/-/openapi-ts-0.99.0.tgz))
2. The project's committed example output — one file, one type, no route registration
   ([examples/openapi-ts-fastify/src/client/fastify.gen.ts](https://github.com/hey-api/hey-api/blob/main/examples/openapi-ts-fastify/src/client/fastify.gen.ts)):

```ts
import type { RouteHandler } from 'fastify';
export type RouteHandlers = {
  listPets: RouteHandler<{ Querystring?: ListPetsData['query']; Reply: ListPetsResponses }>;
  // …
};
```

Also: `glue` in the docs snippet is [the hapi.js server composer on npm](https://registry.npmjs.org/glue),
not a Fastify glue package. Treat that docs section as aspirational.

**So: the plugin gives you typed handler *signatures* (request parts typed from the spec, `Reply`
unioned from the spec's success and error responses). It does not generate route registration, URL
→ handler mapping, or JSON Schema for validation.** You still write `fastify.post('/bookings', …)`
by hand. The `Reply` union does use the error-response types, which is the useful half for us.

### 2b. Fastify's own built-in validation, fed from the generated OpenAPI

This is the supported shape. Fastify 5 validates with **Ajv v8** and serialises with
**fast-json-stringify**, both driven by the JSON Schema in the route options
([Fastify: Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)).
`fastify.addSchema()` + `$ref` is the documented mechanism for sharing schemas
([same page](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/#core-concepts)).
The Ajv version Fastify ships is pinned by `@fastify/ajv-compiler` 4.0.7 → `ajv ^8.12.0`
([registry](https://registry.npmjs.org/@fastify/ajv-compiler)).

The catch is the schema dialect, and it is a real one:

- Fastify's docs say "All examples use the JSON Schema Draft 7 specification"
  ([same page](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)).
- Ajv's default export is **draft-07**; `unevaluatedProperties` / `prefixItems` and friends are
  2019-09/2020-12 keywords, and using 2020-12 schemas "requires importing a different Ajv class"
  ([Ajv: JSON Schema support](https://ajv.js.org/json-schema.html)).
- OpenAPI **3.1** schemas *are* JSON Schema 2020-12. TypeSpec's 3.1 output uses
  `unevaluatedProperties` for sealed models ([1.17.0 release notes](https://github.com/microsoft/typespec/releases/tag/typespec-stable%401.17.0)).
- OpenAPI **3.0.0** — TypeSpec's default — instead uses `nullable`, which Ajv supports directly
  ([Ajv: OpenAPI support → `nullable`](https://ajv.js.org/json-schema.html#openapi-support)), and
  `@fastify/swagger` explicitly converts 3.1-style `{type: ['string','null']}` back into
  `nullable` when serving a 3.0 document ([fastify-swagger README](https://github.com/fastify/fastify-swagger#readme)).
- One more 3.0 wrinkle: OpenAPI's `collectionFormat` on array parameters is not a JSON Schema
  keyword, and `@fastify/swagger` documents having to add it to Ajv's `keywords`
  ([fastify-swagger README, "OpenAPI Parameter Options"](https://github.com/fastify/fastify-swagger#readme)).

**Consequence: emit 3.0.0 (the emitter default) and let Fastify's stock Ajv eat it.** Emitting 3.1
and pointing stock Fastify at it is a dialect mismatch we would be paying for on every route.

### 2c. Other realistic options, ranked

| Option | State | Verdict |
| --- | --- | --- |
| **Hand-written Fastify routes + generated `RouteHandlers` types + JSON Schema derived from the same OpenAPI** | Every part is supported and current ([Fastify validation docs](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [hey-api fastify plugin](https://heyapi.dev/docs/openapi/typescript/plugins/fastify)) | **The supported shape.** Contracts decide shapes; we write the six handlers. |
| **`@fastify/swagger` 9.9.2** — generate the OpenAPI document *from* Fastify's routes instead | Current and first-party ([registry](https://registry.npmjs.org/@fastify/swagger), [docs](https://github.com/fastify/fastify-swagger)) | Inverts the source of truth. Fine as a dev-only docs/drift surface; wrong as the direction of travel when TypeSpec is meant to be the source. |
| **`fastify-openapi-glue` 4.11.5** — builds a Fastify route config from an OpenAPI document | Third-party, actively maintained (published 2026-09-18), now also published as `@platformatic/fastify-openapi-glue` ([registry](https://registry.npmjs.org/fastify-openapi-glue), [repo](https://github.com/seriousme/fastify-openapi-glue)) | Does generate route skeletons + validation, but it is community-run and wants to own route registration. Not worth the dependency for six routes. |
| **`fastify-type-provider-zod` 7.0.0** — Zod schemas as Fastify's validator compiler | Current, peers `fastify ^5.5.0`, `zod >=4.1.5` ([registry](https://registry.npmjs.org/fastify-type-provider-zod)) | Only worth it if validation moves off JSON Schema. Nothing generates Zod from our TypeSpec without a second emitter. |
| **`@typespec/http-server-js`** | Alpha, `node:http`/Express only ([README](https://github.com/microsoft/typespec/blob/main/packages/http-server-js/README.md)) | Not for us. |
| Third-party server emitters: `typespec-hono` 0.25.0, `typespec-http-zod` 0.28.0, `tsp-asyncapi` 0.8.0 | All actively published (Oct 2026) ([registry search](https://registry.npmjs.org/-/v1/search?text=keywords:typespec&size=60)) | Hono is a different framework; `typespec-http-zod` is a plausible *validation* escape hatch but adds a second source of truth for shapes. |

**Bottom line for #8's framing question:** the supported shape is a **hand-written Fastify app
consuming generated schemas and generated types**, not a generated Fastify server. The brief's
"server artifacts for Fastify (types, request validation, route stubs)" is achievable for **types**
(`RouteHandlers`) and for **validation** (Ajv compiling the generated OpenAPI schemas), and only
partially for **route stubs** (a type map keyed by `operationId`, not registered routes).

---

## 3. `@hey-api/openapi-ts`: still current, still the suggestion — with one caveat

**Actively maintained, but on a pre-1.0 cadence with a lull.** Latest stable is **0.99.0**, published
**2026-06-22** ([registry](https://registry.npmjs.org/@hey-api/openapi-ts), [release](https://github.com/hey-api/hey-api/releases/tag/2026-06-22)).
Stable releases were frequent before that (0.97.0 April, 0.98.0 June 1, 0.98.2 June 8), but since
0.99.0 the project has published only nightly prereleases (`0.0.0-next-*`, most recent
**2026-09-30**), i.e. roughly four months without a stable tag
([registry version list](https://registry.npmjs.org/@hey-api/openapi-ts)). The upstream repo is
`hey-api/hey-api` — openapi-ts was moved out of `hey-api/openapi-ts` into the monorepo, which is why
older issue and PR links still point at the old repo ([0.99.0 release notes](https://github.com/hey-api/hey-api/releases/tag/2026-06-22)).

I could **not** find a public statement of what the nightly-only period is for (a 1.0? an internal
rearchitecture?). Treat it as **unexplained**, not as a red flag: the code is public, the changelog
is public, and the `@hey-api/client-fetch` runtime peer is still `< 2`.

**Still the suggested client generator for OpenAPI → TypeScript client.** The docs' positioning is
unchanged ([heyapi.dev](https://heyapi.dev/docs/openapi/typescript/get-started)), it is what the
TypeSpec/OpenAPI ecosystem points at for TS clients, and the alternatives are weaker for this stack
(see the `openapi-typescript` peer-dependency trap in §4).

**What it generates:**

- **HTTP client** — Fetch, Axios, Angular, Next.js, Nuxt, ky, ofetch ([clients](https://heyapi.dev/docs/openapi/typescript/clients)).
- **Typed types** — one `types.gen.ts` with per-operation `…Data`, `…Responses` and `…Errors`
  ([SDK plugin docs](https://heyapi.dev/docs/openapi/typescript/plugins/sdk), which show
  `client.post<AddPetResponses, AddPetErrors>`).
- **SDK** — flat tree-shakeable functions (default) or a class ([same page](https://heyapi.dev/docs/openapi/typescript/plugins/sdk)).
- **Validators** — Zod / Valibot / ArkType schemas, opt-in ([validators](https://heyapi.dev/docs/openapi/typescript/plugins/sdk#validators)).
- **TanStack Query hooks** — `@tanstack/react-query` among the query plugins
  ([heyapi.dev](https://heyapi.dev/), [core plugins](https://heyapi.dev/docs/openapi/typescript/core)).

**Does it type errors usefully?** Yes, and this matters given ADR 0007 (every error is `{ message }`
with a status code, no machine-readable codes): the SDK returns `{ data, error }` and generates an
`…Errors` type from the spec's declared error responses
([SDK docs](https://heyapi.dev/docs/openapi/typescript/plugins/sdk)). With a single `{ message }`
error model, the discriminator is the status code, which survives into `…Errors` as long as the
TypeSpec contract declares the 4xx responses explicitly. Worth stating in the contract: if we only
declare the happy path, the client types will not know 409 exists.

**Frontend fit (Vite + React 19 + TS):** `@hey-api/vite-plugin` 0.3.2 peers
`vite ^5 || ^6 || ^7 || ^8` — Vite 8 is covered ([registry](https://registry.npmjs.org/@hey-api/vite-plugin);
current Vite is 8.3.4, [registry](https://registry.npmjs.org/vite)). `@tanstack/react-query` 5.104.2
peers `react ^18 || ^19` — React 19 covered ([registry](https://registry.npmjs.org/@tanstack/react-query)).
The generated runtime `@hey-api/client-fetch` 0.13.1 is dual ESM/CJS with `"type": "module"`
([registry](https://registry.npmjs.org/@hey-api/client-fetch)), so ESM-only is fine either way.

---

## 4. Version-compat risks for *this* stack

Checked against the repo's own `package.json` (`typescript ^6.0.3`), `.github/workflows/ci.yml`
(pnpm 11, Node 22) and `AGENTS.md`.

| Risk | Status | Evidence |
| --- | --- | --- |
| **openapi-ts vs TypeScript 6** | **Clear.** peer is `">=5.5.3 \|\| >=6.0.0 \|\| 6.0.1-rc"` and the project develops against `typescript 6.0.3` | [openapi-ts package.json in the 0.99.0 tarball](https://registry.npmjs.org/@hey-api/openapi-ts/-/openapi-ts-0.99.0.tgz) |
| **TypeScript is now on 7.x** | Worth noting: `typescript` latest is **7.0.2** (2026-07-08), `next` 7.1.0-dev; 6.0.3 is from 2026-04-16. We are on the previous major, not a dead version | [registry](https://registry.npmjs.org/typescript) |
| **openapi-ts vs Node 22** | **Clear.** `engines: node >=22.18.0`. CI pins Node 22 but **not a patch level** — if `actions/setup-node` resolves 22.0.x or 22.1–22.17, the engine check can fail | [tarball](https://registry.npmjs.org/@hey-api/openapi-ts/-/openapi-ts-0.99.0.tgz), [ci.yml](../.github/workflows/ci.yml) |
| **TypeSpec vs Node 22** | **Clear.** `@typespec/compiler` 1.17.0 `engines: node >=22.0.0` | [registry](https://registry.npmjs.org/@typespec/compiler) |
| **ESM-only repo** | **Clear.** openapi-ts is `"type": "module"`, `.mjs` output, CLI at `bin/run.js`; the generated client runtime is dual. Nothing here assumes CJS | [tarball](https://registry.npmjs.org/@hey-api/openapi-ts/-/openapi-ts-0.99.0.tgz), [client-fetch](https://registry.npmjs.org/@hey-api/client-fetch) |
| **Fastify 5** | **Clear.** current fastify is 5.12.7; the plugin imports `RouteHandler` from `fastify` and the docs title is "Fastify v5 Plugin" | [registry](https://registry.npmjs.org/fastify), [plugin docs](https://heyapi.dev/docs/openapi/typescript/plugins/fastify) |
| **pnpm 11** | **No signal either way.** openapi-ts documents `pnpm add -D -E` and publishes no pnpm-specific config. The `-E` (save-exact) convention matches the "pin the exact version" guidance on [its versioning page](https://heyapi.dev/docs/openapi/typescript/get-started#versioning) | [get-started](https://heyapi.dev/docs/openapi/typescript/get-started) |
| **pnpm build-script allowlist** | Friction, not a blocker: pnpm blocks lifecycle scripts of deps by default, and `pnpm-workspace.yaml` currently allowlists esbuild only. openapi-ts ships a prebuilt CLI with no postinstall, but `@hey-api/client-fetch` and any future `esbuild`-style dep would need allowlisting | [get-started](https://heyapi.dev/docs/openapi/typescript/get-started), `pnpm-workspace.yaml` |
| **⚠️ `openapi-typescript` is a trap** | If anyone proposes it as the client generator: `openapi-typescript@7.13.0` declares `peerDependencies: { typescript: "^5.x" }` — it will not install cleanly against our TS 6. It also only emits *types*, no client | [registry](https://registry.npmjs.org/openapi-typescript) |
| **OpenAPI 3.1 vs Fastify's Ajv** | Real, see §2b. Emit 3.0.0 (the emitter default) | [emitter options](https://github.com/microsoft/typespec/blob/main/packages/openapi3/README.md#openapi-versions), [Ajv](https://ajv.js.org/json-schema.html) |
| **openapi-ts versioning policy** | It self-describes as "[in initial development](https://semver.org/#spec-item-4). Please pin an exact version". Every 0.9x minor has shipped breaking changes (0.97.0 alone had 15) | [get-started → versioning](https://heyapi.dev/docs/openapi/typescript/get-started#versioning), [0.97.0 notes](https://github.com/hey-api/hey-api/releases/tag/2026-04-28) |

### Practical consequences worth writing down

1. **Node in CI must be ≥ 22.18.0**, not merely "22", or `pnpm install` will warn/fail on
   openapi-ts's engine. Small, concrete, and currently unstated in `ci.yml`.
2. **Pin openapi-ts exactly** (`-E`), because it is pre-1.0 and its minors break.
3. **The Fastify plugin is types-only.** If the blocked tickets assume generated route files, that
   assumption is wrong and the plan must be hand-written routes over generated schemas.
4. **Do not let the contract omit error responses.** ADR 0007's `{ message }` model means the
   client's `…Errors` types are only as good as the 4xx responses the TypeSpec declares.

---

## 5. Uncertainty and disagreements between sources

Stated plainly rather than smoothed over:

1. **The hey-api Fastify plugin's documentation contradicts its implementation.** The docs page
   promises generated route handlers and shows `fastify.register(glue, …)`; the shipped plugin emits
   a single `RouteHandlers` type, the committed example emits a single `RouteHandlers` type, and
   `glue` on npm is an unrelated hapi package. I trust the implementation and the example file over
   the prose. Treat the plugin as beta — which is what the page's own badge says.
2. **openapi-ts has had no stable release since 2026-06-22**, with nightly prereleases through
   2026-09-30 and no published explanation. I found no announcement of a 1.0, a rewrite, or a
   pause. This is the single largest unknown in the client-generator half of the pipeline, and it is
   unknown rather than alarming.
3. **`@typespec/http-server-js` is the successor to a removed package and is explicitly alpha**,
   pinned to compiler `^1.16.0` while the compiler is 1.17.0. Its trajectory matters (it is
   first-party) but nothing about it is usable for a Fastify app today.
4. **I did not run any of these tools.** Everything above is documentation, registry metadata and
   published-tarball inspection. The claims most worth a spike before we commit to them are:
   (a) that `RouteHandlers` composes cleanly with Fastify 5's own `RouteHandlerMethod` generics in
   a real route registration; (b) that a TypeSpec-emitted **3.0.0** document's schemas compile under
   Fastify's stock Ajv without `ajv.customOptions`; (c) the exact set of TypeSpec TypeSpec-syntax
   constructs (`@minValue`, `@pattern`, `utcDateTime` formats) whose emitted 3.0 schemas Ajv accepts
   — `int64` safeint handling and `format` keywords are the likely friction points
   ([emitter's `safeint-strategy` option](https://github.com/microsoft/typespec/blob/main/packages/openapi3/README.md#safeint-strategy),
   [Ajv formats](https://ajv.js.org/guide/formats.html)).
5. **Sources did not disagree about TypeSpec itself** — 1.17.0 / `@typespec/openapi3` 1.17.0 was
   consistent across the docs site, npm and the release notes.

---

## Headline

The TypeSpec half of the pipeline is healthy and current (compiler and OpenAPI emitter both 1.17.0,
Node 22-compatible, default output OpenAPI 3.0.0). The Fastify half has **no generated-server story
at all** — the supported shape is hand-written Fastify 5 routes consuming generated JSON Schema for
validation plus a generated `RouteHandlers` type map for signatures. `@hey-api/openapi-ts` is still
the current OpenAPI→TS client generator and already supports TypeScript 6, Vite 8, React 19 and
ESM, but it is pre-1.0, its stable channel has been quiet since June 2026, and its Fastify plugin
does far less than its own docs page claims.
