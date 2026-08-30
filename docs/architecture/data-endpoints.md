# Data Endpoints

How the app's dataset is produced and served in every environment: one shared converter behind two thin wrappers — a local file for development (`scripts/convert-data.ts`) and a Vercel serverless HTTP endpoint for production (`api/convert-data.ts`, cached hard at the edge).

## The one idea: same converter, different I/O boundary

There is exactly **one** conversion implementation — `convertMasterScoresToJson(buffer)` in `lib/` (see [`spreadsheet-conversion/`](./spreadsheet-conversion/conversion-architecture.md)). It's pure: buffer in, `SuperstarsData | ConversionErrors` out, no I/O. Everything else is a thin wrapper that supplies the buffer and does something with the result:

| Wrapper | Reads the spreadsheet from | Emits the result to | Used by |
| --- | --- | --- | --- |
| `scripts/convert-data.ts` | local disk (`data/*.xlsx`) | a file (`public/data/master-scores.json`) | `npm run convert-data` (dev + Docker) |
| `api/convert-data.ts` | **private GCS bucket** | an **HTTP response** | production (and `npm run dev:api`) |

So `api/convert-data.ts` is the deployed twin of the local script. The interesting logic lives in `lib/`; this file only handles the GCS fetch, the HTTP contract, and caching.

## Local vs production

Where the browser fetches the dataset is chosen at build time from `VITE_DATA_SOURCE` (see [client-side data fetching](./client-side-data-fetching.md)). That single var is what separates the three run modes:

| Command / env | `VITE_DATA_SOURCE` | Dataset comes from | The function runs? |
| --- | --- | --- | --- |
| `npm run dev` | `local` (default) | `/data/master-scores.json` — the pre-generated file, served by Vite from `public/` | no |
| `npm run dev:api` | `api` | `/api/convert-data` — the **real** function, run by the Vercel emulator on `:3000` | yes, locally |
| production (Vercel) | `api` | `/api/convert-data` — the deployed function | yes, at the edge/origin |

- **`npm run dev`** is the everyday workflow. It never touches GCS; you regenerate the JSON by hand with `npm run convert-data` after editing the spreadsheet.
- **`npm run dev:api`** (`VITE_DATA_SOURCE=api vercel dev`) boots the Vercel CLI's local emulator, which serves the frontend **and** the `api/` functions on one origin — so you can exercise the true GCS → convert → HTTP path locally. It needs the global Vercel CLI (`npm i -g vercel`) and a populated `.env`. Vite reads the `VITE_`-prefixed var straight from the inline env, so no `.env.api` / `--mode` juggling. The first run prompts once to link the Vercel project.

Both dev modes and production run the identical `lib/` converter; only the wrapper and data source differ.

## Request pipeline

```
GET /api/convert-data
  └─ handler(_req, res)                              api/convert-data.ts
       ├─ downloadSpreadsheet()
       │    ├─ read GCS_PRIVATE_BUCKET + GCS_SERVICE_ACCOUNT_KEY   ← server-only env
       │    │    └─ missing → log detail, throw generic
       │    └─ Storage(credentials).bucket(b).file('spreadsheet/<name>').download() → Buffer
       ├─ convertMasterScoresToJson(buffer)          lib/convertMasterScores.ts
       ├─ isConversionErrors(result) → 200 + ConversionErrors  (uncached)
       └─ else → 200 + SuperstarsData               (cached, see below)

  download/convert throws → catch → log cause, 200-less 500 + generic message
```

### Response contract

The contract is shaped to match the client's `jsonFetcher` (`src/services/fetchJson.ts`), which throws a **generic** error on any non-OK status and never reads the body:

| Outcome | Status | Body | Cached |
| --- | --- | --- | --- |
| Success | `200` | `SuperstarsData` | yes (`Cache-Control`) |
| Converter reported errors (missing/corrupt sheet) | `200` | `ConversionErrors` (`{ errors: [...] }`) | no |
| Missing env / GCS download failure | `500` | `{ error: 'Failed to load data' }` | no |

Conversion errors come back as **200** deliberately: a non-OK status would be swallowed by `jsonFetcher` as a generic fetch failure, losing the detail. At 200 the client's `fetchMasterScores` runs `isConversionErrors` on the body and re-throws the real `ConversionError[]` for the Error Page.

### Error hygiene

Client-facing messages are **fixed and generic** (`'Server is not configured to load data'`, `'Failed to load data'`) so nothing internal — env key names, bucket names, GCS SDK detail — leaks in the response. The real cause is written to `console.error`, visible in Vercel's **function logs** for debugging.

## Caching

The dataset changes roughly **once a year**, so the successful response is cached hard at Vercel's edge CDN. The header is:

```
Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800
```

| Directive | Value | Applies to | Effect |
| --- | --- | --- | --- |
| `max-age=0` | 0s | the **browser** (private cache) | always revalidate — browsers never serve a copy we can't purge |
| `s-maxage=86400` | **24 hours** | the **edge** CDN (shared cache) | serve from the edge for a day without invoking the function |
| `stale-while-revalidate=604800` | **7 days** | the edge | after the 24h, keep serving the stale copy *instantly* while refetching fresh in the background |

**What this means in practice.** Only the edge (Vercel's globally-distributed CDN, close to each user) caches the data; the origin function runs only on a cache miss. Timeline for one edge location after a refresh at T=0:

- **T = 0–24h** — edge serves the cached copy directly; the function is not called.
- **T = 24h, first request** — the edge does two things at once: returns the *stale* copy to that requester immediately, and refetches fresh from the function in the background to replace the cache. Nobody waits on the origin; exactly one request per cycle sees marginally-old data.
- **T > 24h + 7 days** with no traffic — the stale copy is too old to serve; the next request is a hard miss and blocks for a fresh fetch.

Net effect: with no action, a spreadsheet update reaches everyone within **~24 hours**, and no user ever eats the GCS + function latency.

### Clearing the cache manually

The edge doesn't know when the GCS spreadsheet changes, so an upload alone doesn't bust the cache. To force it immediately, **redeploy the project on Vercel** — each production deployment starts with a cold edge cache. (There's no per-path CDN purge API on a plain, non-Next Vercel project; redeploy is the lever.) Since the data changes yearly, a one-off redeploy after an upload is entirely sufficient — no automation needed.

## Environment & dependencies

Server-only env (never `VITE_`-prefixed; injected into the function by Vercel / `vercel dev`), documented in [`.env.example`](../.env.example):

- `GCS_PRIVATE_BUCKET` — the private bucket holding `spreadsheet/*.xlsx`.
- `GCS_SERVICE_ACCOUNT_KEY` — the service-account JSON (whole blob) for read access.

Dependencies: `@google-cloud/storage` (the one new prod dep). The Vercel CLI is installed **globally**, not as a devDependency, and the handler is typed with Node's built-in `node:http` `IncomingMessage`/`ServerResponse` rather than `@vercel/node` — so no `@vercel/node` package is needed.
