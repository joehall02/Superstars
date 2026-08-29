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
