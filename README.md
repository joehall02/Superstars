# Superstars

A web app for a family tradition called **Superstars** — each year, family members are drafted into teams and compete across a series of games. The app displays leaderboards, per-game breakdowns, all-time rankings, scores, and player profiles.

## Overview

Superstars is a static React front end with a thin serverless API behind it. A single spreadsheet (`Superstars - Master Scores.xlsx`) is the source of truth for every score; a set of hand-authored config files controls entirely how that data is *presented* (images, labels, rules, navigation). The guiding principle: **the spreadsheet is a verbatim mirror**, fetched once and sliced many ways, with presentation kept separate in the config layer.

### Features

- **Leaderboards** — player standings for a given year
- **Games** — the series of games played, with per-game details and scores
- **Rankings** — all-time rankings across years
- **Players** — individual player scores and player profiles 

## Tech Stack

| Area | Choice |
| --- | --- |
| Language | TypeScript |
| UI | React 19, Material UI (MUI) + Emotion, `tss-react` |
| Routing | React Router (lazy-loaded routes) |
| Data fetching | TanStack React Query |
| Build tooling | Vite |
| Data source | `.xlsx` spreadsheet parsed with SheetJS (`xlsx`) |
| Backend | Vercel serverless functions + Google Cloud Storage |
| Testing | Vitest |
| Linting | ESLint + Stylistic |
| Hosting | Vercel |

See [`technical-decisions.md`](./docs/technical-decisions.md) for the rationale behind these choices.

## Architecture

```
Superstars - Master Scores.xlsx
        │
        │  convertMasterScoresToJson(buffer)   ← the one pure converter (lib/)
        ▼
   ┌─────────────────────────────┬─────────────────────────────┐
   │  scripts/convert-data.ts    │  api/convert-data.ts        │
   │  (dev + Docker)             │  (production)               │
   │  disk → public/data/*.json  │  private GCS → HTTP + cache │
   └──────────────┬──────────────┴──────────────┬──────────────┘
                  │        VITE_DATA_SOURCE     │
                  ▼        picks one at build   ▼
            /data/master-scores.json      /api/convert-data
                  └──────────────┬──────────────┘
                                 ▼
                   Client-side data fetching (React Query)
                   fetch once → validate → slice per page
                                 │
                                 ▼
                          Components ◄ ──── Config Service
                                          (images, labels, rules, nav)
```

Full details live in [`docs/architecture.md`](./docs/architecture.md), which maps out:

- [Spreadsheet Conversion](./docs/architecture/spreadsheet-conversion/conversion-architecture.md) — how the `.xlsx` becomes the JSON data contract
- [Data Endpoints](./docs/architecture/data-endpoints.md) — how the dataset is produced and served (local file vs. serverless GCS endpoint)
- [Client-Side Data Fetching](./docs/architecture/client-side-data-fetching.md) — one React Query fetch, validation, per-page selectors
- [Config Service](./docs/architecture/config-service/config-service.md) — the presentational reference data
- [Bundle Splitting](./docs/architecture/bundle-splitting.md) — vendor chunking and per-route lazy loading

## Local Setup

**Prerequisites:** Node.js (LTS) and npm.

```bash
# Install dependencies
npm install

# Start the dev server (uses local JSON data)
npm run dev
```

By default the app reads pre-converted JSON from `public/data/`. To regenerate that data from the master spreadsheet:

```bash
npm run convert-data
```

To run the dev server against the serverless API instead of local files:

```bash
npm run dev:api   # uses vercel dev with VITE_DATA_SOURCE=api
```

Environment variables are documented in [`docs/.env.example`](./docs/.env.example).

## Docker (production-like local testing)

Build the production bundle behind Nginx locally (serves at http://localhost:8080):

```bash
npm run docker:build
npm run docker:run
```

It uses the local data path (`VITE_DATA_SOURCE=local`) and reads `.env.production`
for `VITE_GCS_PUBLIC_BASE_URL`; the master spreadsheet must be present in `data/`.
See [`docs/architecture/docker.md`](./docs/architecture/docker.md) for the full
setup — build stages, environment handling, and the Nginx config that mirrors
`vercel.json`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (local JSON data) |
| `npm run dev:api` | Dev server against the serverless API (`vercel dev`) |
| `npm run convert-data` | Convert the master spreadsheet into JSON |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` / `lint:fix` | Lint (and auto-fix) with ESLint |
| `npm test` / `test:watch` / `test:coverage` | Run tests with Vitest |
| `npm run preview` | Preview the production build locally |
| `npm run docker:build` | Build the production-like Docker image (Nginx) |
| `npm run docker:run` | Run the image at http://localhost:8080 |

## Deployment

The app is deployed to Vercel. See the deployment and infrastructure guides:

- [Vercel Deployment Guide](./docs/plans/vercel-deployment-guide.md)
- [GCS Bucket Setup](./docs/plans/gcs-bucket-setup.md)
- [Domain Setup](./docs/plans/domain.md)
- [Security Tightening](./docs/plans/security-tightening.md)

## Further Documentation

- [`docs/architecture.md`](./docs/architecture.md) — architecture map and index
- [`docs/technical-decisions.md`](./docs/technical-decisions.md) — key decisions and rationale
- [`docs/implementation-plan.md`](./docs/implementation-plan.md) — phased build checklist
- [`docs/errors/errors.md`](./docs/errors/errors.md) — error response examples and handling

## License

[MIT](./LICENSE) © Joe Hall
