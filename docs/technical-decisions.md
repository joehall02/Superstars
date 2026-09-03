# Technical Decisions & Refactoring Backlog

Architectural decisions and potential refactors to revisit as the codebase grows. Each entry records the current approach, why it's sufficient now, and what would trigger a change.

---

## Extract MasterScoreRepo from MasterScoreService

**Current approach:** Pure extraction methods (`getAllTimeRankings`, `getYearRankings`, etc.) live directly on `MasterScoreService` alongside the React Query hook methods.

**Why it works now:**
- Extraction methods are simple property accessors on a single JSON blob
- Only consumed by the service's own `select` callbacks
- Already testable in isolation (pure functions, no React dependency)
- One data source — no abstraction over multiple stores needed

**Revisit if:**
- Extraction logic becomes complex (filtering, aggregating, joining across datasets)
- Multiple services need the same extraction methods
- A second data source is added that needs a uniform query interface

---

## Docker Data Fetching Strategy

**Current approach:** Docker uses the same data fetching logic as local development (`VITE_DATA_SOURCE=local`), fetching from the pre-generated JSON file in `data/master-scores.json`. Production uses `VITE_DATA_SOURCE=api` to fetch from Vercel serverless functions.

**Why it works now:**
- Avoids duplicating serverless function logic in a local Express server
- Simple environment variable switch (`local` vs `api`)
- Data conversion happens at build time in Docker (`npm run convert-data`)
- Same code path as local development reduces complexity

**Revisit if:**
- Need to test serverless function behavior locally (timeouts, cold starts, etc.)
- Add multiple API endpoints with different caching strategies
- Require real-time data updates in Docker environment
- Production API logic diverges significantly from local JSON structure

---

## Spreadsheet Parsing Library (SheetJS `xlsx` vs ExcelJS)

**Current approach:** The shared conversion logic in `lib/convertMasterScores.ts` uses SheetJS (`xlsx`). Because SheetJS no longer publishes to the public npm registry (frozen at `0.18.5`, unmaintained, and flagged by `npm audit` with no fix available), the dependency is pinned to the patched build from the official SheetJS CDN:

```bash
npm rm xlsx
npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

Docs: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ · CDN index: https://cdn.sheetjs.com/

**Why it works now:**
- The `lib/` conversion logic (and its tests) is already written and tested against the SheetJS API (`XLSX.read`, `XLSX.write`, workbook objects) — switching libraries is a rewrite for no functional gain today.
- The CDN tarball is the officially sanctioned install method and delivers the patched version (`0.20.3`), so the `npm audit` warning is resolved.
- The known CVEs (prototype pollution GHSA-4r6h-8v6p-xvw6, ReDoS GHSA-5pgg-2g8v-p4x9) only trigger when **reading crafted/untrusted files**. This app parses our own trusted spreadsheet server-side / at build time — not user uploads — so practical risk is low.

**Known trade-offs of the CDN pin:**
- Dependabot / `npm audit` can't see CDN-hosted versions, so future SheetJS updates must be tracked manually.
- Bypasses any private registry / proxy and makes a single third-party CDN the supply-chain source of truth.
- SheetJS left npm due to a legal/2FA dispute with npm, Inc.; the free Community Edition is effectively in maintenance-limbo behind a paid "Pro" push.

**Revisit / migrate to [ExcelJS](https://www.npmjs.com/package/exceljs) if:**
- The app ever accepts **user-uploaded spreadsheets** (untrusted input raises the CVE risk materially).
- We want Dependabot / `npm audit` to actually track this dependency again (ExcelJS stays on npm normally, ~12M weekly downloads, de-facto replacement).
- SheetJS CE governance/maintenance deteriorates further.

The conversion logic is isolated to `lib/`, so a swap later is contained to one module — not a sprawling change.

---

## Generated Data Folder Tracked via `.gitkeep`

**Current approach:** `npm run convert-data` writes the generated JSON to `public/data/master-scores.json`. The folder is kept in the repo by committing an empty `public/data/.gitkeep`, while `.gitignore` ignores the folder's *contents* (`public/data/*`) and negates the marker (`!public/data/.gitkeep`). The convert script therefore just writes into an always-present directory — it does not create the folder at runtime.

**Why it works now:**
- Git tracks files, not directories, so an ignored-but-empty `public/data/` would not survive a clone; `.gitkeep` makes the directory part of the committed repo structure.
- Vite serves `public/` at the URL root, so `public/data/master-scores.json` is reachable at `/data/master-scores.json` in dev and copied into `dist/` on build — the folder needs to exist for that path to resolve regardless of whether the JSON has been generated yet.

---

## Test Runner (Vitest instead of Jest)

**Current approach:** Tests run on Vitest, configured via a `test` block in `vite.config.ts` (`globals: true`, `environment: 'node'`, discovering `*.test.ts(x)` under `lib/` and `src/`). The implementation plan originally called for Jest (`jest`, `ts-jest`, `@types/jest`) in §5.6; that has been superseded.

**Why we switched:** This is a Vite + ESM project (`"type": "module"`, `moduleResolution: "bundler"`, `verbatimModuleSyntax`, extensionless `.ts` imports). Jest runs on CommonJS, so `ts-jest` had to transpile the ESM/bundler code down to CJS. Making that work required forcing `module: "commonjs"` + `moduleResolution: "node"` (the legacy `node10` mode TypeScript 6 deprecates), then silencing the deprecation with `ignoreDeprecations` and disabling `verbatimModuleSyntax` — a stack of workarounds papering over the mismatch between a modern ESM codebase and a CommonJS runner. There is no clean escape within Jest: the only non-deprecated resolution that supports the extensionless imports is `bundler`, which cannot pair with `module: "commonjs"`.

Vitest removes the mismatch entirely:
- Reads the existing bundler `tsconfig` natively (esbuild), so no `ts-jest`, no CJS translation, no `moduleResolution` deprecation, no `ignoreDeprecations` mask.
- Shares one config file with Vite and runs `lib/` + `src/` as a single suite.
- Jest-compatible API (`describe` / `test` / `expect`), so the already-working `lib/convertMasterScores.test.ts` needed no changes (globals enabled to match its bare, import-free assertions).

**Trade-offs accepted:**
- Deviates from the plan's stated Jest choice (plan updated to match).
- `test:coverage` needs an extra package (`@vitest/coverage-v8`), deferred until coverage is actually run.
- Component tests that need the DOM must opt into the `jsdom` environment per-file (`// @vitest-environment jsdom`), which also requires installing that environment.

**Revisit if:** we ever need a Jest-only ecosystem tool with no Vitest equivalent — unlikely, and Vitest's Jest-compatible API keeps migration cost low either direction.

---

## `lib/` Typechecking (shared with the browser app config)

**Current approach:** `lib/` (the shared conversion logic) is typechecked by `tsconfig.app.json` alongside `src/`, rather than living in its own TypeScript project. To make the Node/build-time code coexist with the browser app config, two of the app config's strict settings were relaxed:
- `types` includes `"node"` (so `Buffer` and other Node globals resolve — the converter takes a `Buffer`).
- `erasableSyntaxOnly` is set to `false` (the lib is built on `enum`s in `lib/enums.ts`, which erasable-only syntax forbids).

**Why we did it this way:** `lib/` is Node/build-time code (it reads a `Buffer`, uses SheetJS server-side), but its type surface — `SuperstarsData`, `GameRankings`, etc. — is imported directly by `src/`. Because `src/` imports `lib/` source, TypeScript pulls `lib/` into the app program regardless of where `lib/` is "assigned," so a separate `tsconfig.lib.json` on its own would **not** isolate the two — the enum/`Buffer` conflicts would just resurface via `src/`'s imports. `lib/` and `src/` are also bundled into the same app by Vite and ship together; they aren't independent deliverables. Relaxing the two flags is the low-friction fit for code that is genuinely coupled.

**Trade-offs accepted:**
- Browser `src/` code no longer gets a compile error if it references Node globals (`Buffer`, `process`) — which would fail at runtime. Minor, and caught quickly in practice.
- Enums are permitted app-wide. Harmless here: Vite/esbuild compile enums fine; `erasableSyntaxOnly` was optional strictness, not a build requirement.

**The proper-isolation alternative (deferred):** make `lib/` a `composite` referenced project (`tsconfig.lib.json` with `composite: true`, Node settings; `tsconfig.app.json` references it and drops `lib` from `include`). A composite project emits `.d.ts`, so `src/` would consume `lib/`'s *declarations* instead of its source, and `lib/`'s config would never leak into the browser project. Costs: three configs + reference wiring, build-order coupling, and `composite`'s emit constraints interacting with `noEmit`.

**Revisit if:** `lib/` ever needs to become a standalone/publishable package, or `src/` stops importing `lib/` source directly — that's when the composite split's isolation actually pays for its complexity.

---

## CI Pipeline Scope (GitHub Actions)

**Current approach:** A single `ci.yml` workflow runs on push and PRs to `main`/`develop`. One `ubuntu-latest` job installs with `npm ci` (Node 24, npm cache) and runs the existing scripts sequentially: `lint` → `typecheck` → `test` → `build`. A `concurrency` group cancels superseded runs on the same ref. This mirrors the Husky `pre-push` hook (`lint` + `test`) and adds the typecheck/build coverage the hook skips.

**Why it works now:**
- The suite is small — sequential steps in one job finish fast, and fail-fast ordering saves runner minutes versus parallel jobs whose checkout/install overhead would outweigh any speedup.
- One Node version matches local dev (`v24`); no compatibility matrix is needed for an internally-deployed app.
- `npm ci` already enforces a frozen lockfile, so builds are reproducible without extra tooling.

**Potential future improvements (revisit as the project grows):**

1. **Status badges in README** — build/test/coverage badges (the one remaining unchecked item in plan §5.7). Cheap once the workflow has run on GitHub at least once.
2. **Coverage reporting** — `test:coverage` (`vitest run --coverage`) exists but `@vitest/coverage-v8` isn't installed yet. Add the package, then either upload to a service (Codecov) or publish an artifact, and gate on a coverage threshold once meaningful test coverage exists.
3. **Confirm `build` is data-independent in CI** — `vite build` runs without a spreadsheet in `data/`, and the generated `public/data/master-scores.json` is gitignored. If the build (or a smoke test) ever comes to depend on that JSON, add a `convert-data` step against a committed fixture spreadsheet so CI matches local output.
4. **Dependabot** — a `.github/dependabot.yml` for weekly bumps, given the number of `^`-ranged devDeps. Note the SheetJS `xlsx` CDN pin is invisible to Dependabot (see the SheetJS decision above) and must still be tracked manually.
5. **CodeQL / security scanning** — a lightweight `github/codeql-action` workflow for defence-in-depth on a public-facing app.
6. **Job parallelism / build matrix** — only if the suite grows enough that splitting lint/typecheck/test/build into parallel jobs (or testing multiple Node versions) genuinely reduces wall-clock time; today it would add overhead for no gain.
7. **Deploy integration** — Vercel handles deploys via its own Git integration today. If deployment ever needs CI-orchestrated gating (deploy only after green CI), wire a deploy job keyed off the CI job's success.

**Revisit if:** CI wall-clock time becomes a bottleneck, test coverage grows enough to warrant enforcement, the app starts accepting untrusted input, or deployment needs to be gated on CI rather than run independently by Vercel.

---

## Auth Token Format (raw HMAC token instead of JWT)

**Current approach:** The site-password gate (plan §2.1) issues a self-signed token of the form `issued.signature`, where `signature` is an HMAC-SHA256 of the issued timestamp keyed with a server-only `AUTH_SECRET`. The login endpoint mints it after a constant-time password check; protected endpoints verify it with a shared `verifyToken()` helper that recomputes the HMAC (constant-time compare) and rejects expired tokens. No JWT library is involved.

**Why it works now:**
- The token carries exactly one bit of state — "someone entered the correct shared password." There are no user identities, roles, or per-user claims, which is the structured payload JWT exists to carry.
- Zero dependencies: `node:crypto` ships with the Vercel Node runtime, so there's no `jsonwebtoken`/`jose` to install, patch, or audit.
- Smaller footgun surface: JWT's well-known pitfalls (`alg: none`, HS/RS algorithm confusion) all live in verifier misconfiguration. A hand-rolled verifier that recomputes a single HMAC has no algorithm field for an attacker to manipulate.
- Expiry is trivial — the issued timestamp is embedded and compared against a max-age, which is all the `exp` machinery would buy us here anyway.

**Trade-offs accepted:**
- No standard tooling (jwt.io debugging, off-the-shelf middleware) — irrelevant for a single-secret internal gate we own end to end.
- The token format is bespoke, so any future consumer must understand our scheme rather than reading a JWT out of the box.

**Revisit / migrate to JWT if:**
- Real per-user accounts, roles, or permissions are introduced (structured claims start earning their keep).
- Token refresh flows or short-lived/long-lived token pairs are needed.
- A third-party service or separate backend must validate our tokens (a standard format becomes worth adopting).
- We move to asymmetric signing (RS/ES) so verifiers can check tokens without holding the signing secret.

The signing/verification lives behind the login endpoint and `verifyToken()` helper, so swapping in JWT later is contained to those two spots.

---

## GCS CORS Allow-List (`*` wildcard on the public bucket)

**Current approach:** The public bucket's CORS policy (`gcs-cors.json`) allows all origins — `"origin": ["*"]` — for `GET`/`HEAD`. It is applied with `gcloud storage buckets update gs://superstars-public --cors-file=gcs-cors.json`. The private bucket has no CORS config (it is never read from a browser — the serverless function reads it server-side with a service account).

**Why `*` rather than an explicit allow-list:**
- **Nothing is exposed that isn't already public.** The bucket is world-readable (`allUsers: objectViewer`); its configs and images are public by design. CORS is not an auth boundary — it only decides whether *browser JavaScript* may read a cross-origin response. A wildcard origin therefore grants no access that a plain `curl` doesn't already have.
- **GCS matches origins exactly — no subdomain wildcards.** Vercel Preview deployments get dynamic hostnames (`superstars-git-<branch>-*.vercel.app`, `superstars-<hash>.vercel.app`) that can't be enumerated ahead of time. An explicit list would silently break CORS on every preview, dropping the app back to its bundled `/configs` fallback.
- **No ops treadmill.** Otherwise the production alias, every preview URL, and any future custom domain would each need adding and re-applying.

**Trade-offs accepted:**
- Any site can `fetch()` these public assets from a browser. Acceptable: they're already public and non-sensitive, so this adds no exposure beyond what public-read already allows.
- Doesn't defend against hotlinking / bandwidth use — not a concern at this scale.

**Revisit if:**
- The public bucket ever holds something that shouldn't be embeddable by arbitrary sites → scope origins to known domains (and accept the preview-CORS limitation, or proxy assets through the app).
- Hotlinking becomes a real cost → front the bucket with a CDN / signed URLs rather than tightening CORS.

---

## Root `tsconfig.json` carries `compilerOptions` (for Vercel's function compiler)

**Current approach:** The root `tsconfig.json` is a solution file (`files: []` + `references` to `tsconfig.app.json` and `tsconfig.node.json`), but it *also* carries a standalone `compilerOptions` block (`moduleResolution: "bundler"`, `types: ["node"]`, `module: "esnext"`, etc.). The local build never uses these options — `tsc -b` builds through the `references`, and the root project's own `include` is empty.

**Why it's there:** Vercel's serverless-function compiler (`@vercel/node`) type-checks `api/convert-data.ts` and the files it imports (`lib/`, `shared/`), and it reads the **root `tsconfig.json`** to do so. Per Vercel's docs, that compiler **does not support project `references`** — so it ignores `tsconfig.app.json` (where `lib/` is actually configured; see the *`lib/` Typechecking* entry above) and, with no root `compilerOptions`, falls back to TypeScript defaults: `nodenext` resolution (which rejects the codebase's extensionless imports → TS2835) and no Node types (so `Buffer` is undefined → TS2591). The build still *deployed* — `@vercel/node` transpiles with esbuild regardless of type errors — but the log was full of noise. The root `compilerOptions` block mirrors the app config's bundler-mode + Node-types settings just for that compiler's benefit.

**Trade-offs accepted:**
- The settings are duplicated from `tsconfig.app.json` rather than shared — a `references`-aware tool would make this unnecessary, but Vercel's isn't one. The duplication is small and static (module/resolution/types), so drift risk is low.
- A reader has to know this block exists *only* to satisfy Vercel; it does nothing for `npm run build` or the editor. Hence this note.

**Revisit if:**
- Vercel's Node builder gains project-reference support (then the root block can be dropped and it can read `tsconfig.app.json` directly).
- `api/`/`lib/` move to a dedicated build that no longer depends on the root config being self-sufficient.

---

## `.js` Extensions on Relative Imports in `api/`, `lib/`, `shared/`

**Current approach:** Relative imports **within** `api/`, `lib/`, and `shared/` carry explicit `.js` extensions (`import … from './consts.js'`), even though the files are `.ts`. `src/` keeps its extensionless imports, and `*.test.ts` files in these folders also stay extensionless.

**Why:** The `api/convert-data` serverless function runs on Vercel under Node's **native ESM loader** (the project is `"type": "module"`), and Node ESM **requires** explicit file extensions on relative imports. `@vercel/node` transpiles each `.ts` file individually and traces its imports with `@vercel/nft` — it does **not** bundle them into one file — so an extensionless `import '../lib/consts'` survives to runtime and Node throws `ERR_MODULE_NOT_FOUND`. Because the function imports the converter, the entire `api/` → `lib/` → `shared/` graph executes under Node ESM and needs extensions. TypeScript's `bundler` resolution *lets* us omit extensions (which is why the type-checker was happy and the app builds), but omitting them is exactly what breaks at Node runtime — and TS deliberately will **not** add extensions on emit. See the related [root `tsconfig.json`](#root-tsconfigjson-carries-compileroptions-for-vercels-function-compiler) entry: the same folders, two Vercel constraints.

**Why not the alternatives:**
- **Bundling the function** (an esbuild step / bundler package) would let us keep extensionless imports, but `@vercel/node` has no bundle toggle for standalone `api/` functions, so it means owning extra build tooling outside Vercel's default pipeline.
- **CommonJS functions** resolve extensionless `require`s, but the project is `"type": "module"` (Vite needs it); making only the functions CJS needs nested `package.json` overrides and hits `ERR_REQUIRE_ESM` against ESM dependencies. Fragile cascade.

**Why `src/` and tests stay extensionless:**
- `src/` only ever runs **bundled by Vite**, never under Node ESM, so it never hits the rule.
- `*.test.ts` in these folders run only under **Vitest** (bundler resolution), are excluded from the Vercel deploy (`.vercelignore`), and keeping them extensionless avoids `vi.mock` path-matching friction.

So the rule is: **code that executes under Node ESM (the function's `api`/`lib`/`shared` graph) uses `.js` extensions; code that only runs bundled (`src/`, tests) does not.**

**Revisit if:** the function is ever bundled (a build step, or a future `@vercel/node` bundle option) — extensions become optional again — or the project moves off `"type": "module"`.

---
