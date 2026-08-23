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
