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
