# Architecture

Index of the Superstars architecture docs. Each linked document is self-contained; this page is the map that shows how they fit together.

## The system in one picture

Superstars is a static React app with a thin serverless backend. One spreadsheet is the source of truth for all scores; a set of hand-authored config files supplies everything about how that data is *presented*.

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

The guiding principle throughout: **the spreadsheet is a verbatim mirror**, fetched **once** and sliced many ways, with presentation kept entirely separate in the config layer.

## Documents

### Data pipeline

| Doc | What it covers |
| --- | --- |
| [Spreadsheet Conversion](./architecture/spreadsheet-conversion/conversion-architecture.md) | How the `.xlsx` becomes the `SuperstarsData` JSON contract — the pure `lib/` converter, workbook layout, the verbatim-mirror rule, and the error contract. Supporting: [`spreadsheet-bugs.md`](./architecture/spreadsheet-conversion/spreadsheet-bugs.md), [`example-data-shape.jsonc`](./architecture/spreadsheet-conversion/example-data-shape.jsonc). |
| [Data Endpoints](./architecture/data-endpoints.md) | How the dataset is produced and served — the local file wrapper (`scripts/convert-data.ts`, `npm run dev`) and the production serverless endpoint (`api/convert-data.ts`): GCS fetch → convert → HTTP, prod vs local (`dev` / `dev:api`), the response contract, and edge caching (incl. how to bust it with a redeploy). |
| [Client-Side Data Fetching](./architecture/client-side-data-fetching.md) | How the browser loads `SuperstarsData` — one React Query fetch keyed `['masterScores']`, validation, and per-page hooks/selectors. |

### Presentation

| Doc | What it covers |
| --- | --- |
| [Config Service](./architecture/config-service/config-service.md) | The presentational reference data (game/player images, stat labels, localisation, nav links) — four JSON config files, the functional getter surface, and the React context. Supporting: [`config-shape-examples/`](./architecture/config-service/config-shape-examples/). |

## Related

- [`implementation-plan.md`](./implementation-plan.md) — the phased build checklist.
- [`technical-decisions.md`](./technical-decisions.md) — rationale for key choices.
