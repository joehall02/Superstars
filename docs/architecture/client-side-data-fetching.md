# Client-Side Data Fetching

How the browser gets `SuperstarsData` into components — from a single network fetch, through validation, to per-page hooks.
## The one idea: fetch once, slice many

The Superstars dataset is a single JSON object that changes roughly once per year. So the app fetches the **whole thing exactly once**, caches it forever (for the session), and every page derives its slice from that one cache entry. There is never a second network request, and never a reason to expire the data.

Two pieces make this work:

- **React Query** (`@tanstack/react-query`, added here) owns the cache, the in-flight request, and the loading/error/data state machine.
- A shared **query key `['masterScores']`** ties every hook to the same cache entry. Derived hooks reuse it via `select`, so they return a slice without triggering a refetch.

## Data flow

```
component
  └─ useAllGames() / useGame(id) / …            src/services/masterScores/useMasterScores.ts
       └─ useQuery({ queryKey: ['masterScores'], queryFn, select })
            ├─ queryFn: fetchMasterScores()      src/services/masterScores/fetchMasterScores.ts
            │    ├─ getDataSourceUrl()  ← import.meta.env.VITE_DATA_SOURCE
            │    ├─ fetch(url)
            │    ├─ isConversionErrors()  → throw MasterScoresError   (converter said the sheet is broken)
            │    └─ assertSuperstarsData()                            src/services/masterScores/masterScoresGuard.ts
            │         └─ shape mismatch → throw MasterScoresError
            └─ select: pure extractor            src/services/masterScores/masterScoreSelectors.ts
                 e.g. getAllGames(data) → Game[]
```

The `queryFn` runs **once** per session (shared key + `staleTime: Infinity`). Each hook's `select` runs on the cached result to return just its slice.

## Module layout (`src/services/masterScores/`)

| Module | Holds | React? |
| --- | --- | --- |
| `fetchMasterScores.ts` | The `queryFn`: URL resolution, `fetch`, error passthrough, validation | no |
| `masterScoresGuard.ts` | `assertSuperstarsData` shape guard + `MasterScoresError` | no |
| `dataLoadErrors.ts` | Frontend error factories (`FETCH_FAILED`, `INVALID_DATA_SHAPE`) | no |
| `masterScoreSelectors.ts` | Pure `(data, …args) → slice` extractors — trivially testable | no |
| `useMasterScores.ts` | One base hook + per-page derived hooks | yes |
| `testFixtures.ts` | A small, structurally complete `SuperstarsData` sample | no |
| `index.ts` | Barrel re-export of the public surface | — |

The split is deliberate: everything except `useMasterScores.ts` is plain functions with no React dependency, so the extraction and validation logic can be unit-tested without rendering anything (see `masterScoreSelectors.test.ts`, `masterScoresGuard.test.ts`).

## Environment-based source (`src/config.ts`, `fetchMasterScores.ts`)

Where the data comes from is chosen at build time from the `VITE_DATA_SOURCE` env var:

| `VITE_DATA_SOURCE` | URL | Used in |
| --- | --- | --- |
| `local` (default) | `/data/master-scores.json` | dev + Docker (pre-generated JSON served from `public/`) |
| `api` | `/api/convert-data` | production (Vercel serverless function) |

```ts
export const getDataSourceUrl = (): string =>
  DATA_SOURCE_URLS[import.meta.env.VITE_DATA_SOURCE ?? DataSource.Local];
```

`DataSource` is a string enum and `DATA_SOURCE_URLS` maps each value to its URL, so the switch is total and typo-proof. When the var is unset, it falls back to `local`.

## Validation & error handling

`fetchMasterScores` treats three distinct failures uniformly — each throws a `MasterScoresError`, which lands in React Query's `error` state (destined for the Error Page, section 4.4):

1. **Network failure** — `fetch` rejects → `dataFetchError(url, cause)` → `FETCH_FAILED`.
2. **Non-OK response** — `!response.ok` → `dataFetchError(url, "<status> <statusText>")` → `FETCH_FAILED`.
3. **Converter-reported errors** — the response is a `{ errors: [...] }` payload (the converter emits this instead of data when the spreadsheet is missing/corrupt). Detected with the shared `isConversionErrors` guard and re-thrown carrying the original `ConversionError[]`.
4. **Malformed shape** — passes JSON parsing but doesn't match `SuperstarsData` → `assertSuperstarsData` throws `INVALID_DATA_SHAPE`.

`MasterScoresError extends Error` and carries an `errors: Array<ConversionError | DataLoadError>` field, so the Error Page can render machine-readable detail (codes + context) rather than a bare message. Both error kinds share the same `{ code, message, context? }` shape, which is what lets them coexist in one array.

### The shape guard is pragmatic, not exhaustive

`assertSuperstarsData` checks only the **structural skeleton** the app relies on — the top-level `metadata`/`entities`/`rankings` sections, that `entities` has `players` + `games`, and that `rankings.overall` has `allTime`/`byYear`/`champions` arrays plus a `byGame` map. It does **not** validate every row.

The goal is fail-fast: a malformed payload throws a clear `INVALID_DATA_SHAPE` at the fetch boundary instead of surfacing as a confusing `undefined` deep inside a component. This intentionally pairs with the converter's "verbatim mirror" contract (see `spreadsheet-conversion/`) — the frontend must **not** assume ranks are unique or contiguous, since legitimate ties and known sheet bugs produce repeated/skipped ranks.

## Selectors & hooks

**Selectors** (`masterScoreSelectors.ts`) are pure functions over `SuperstarsData`:

```ts
export const getAllGames = (data) => Object.values(data.entities.games);
export const getYearRankings = (data, year) => data.rankings.overall.byYear[String(year)] ?? [];
```

Two conventions worth noting:
- `byYear` maps are keyed by year **strings**, but callers pass numeric years, so selectors index with `String(year)`.
- "Not found" is expressed as `[]` for lists and `undefined` for single entities — never a throw. Missing years/games/players are normal (e.g. a year with no data yet).

**Hooks** (`useMasterScores.ts`) are thin wrappers. A single generic base hook binds the shared key and `queryFn`; each public hook just supplies a `select`:

```ts
const useMasterScoresQuery = <T>(select: (data: SuperstarsData) => T) =>
  useQuery({ queryKey: masterScoresKey, queryFn: fetchMasterScores, select });

export const useAllGames = () => useMasterScoresQuery(getAllGames);
export const useGame = (gameId: string) => useMasterScoresQuery((data) => getGameById(data, gameId));
```

Components call these directly and receive a standard `UseQueryResult<T>` (`{ data, isLoading, error, … }`). The full set: `useAllTimeRankings`, `useYearRankings(year)`, `useYearChampions(year)`, `useAllGames`, `useGame(id)`, `useGameAllTimeRankings(id)`, `useGameYearRankings(id, year)`, `usePlayer(id)`.

## App wiring

- **`src/queryClient.ts`** — an app-wide `QueryClient` tuned for a never-changing dataset: `staleTime: Infinity`, `gcTime: Infinity`, `refetchOnWindowFocus: false`, `retry: 1`.
- **`src/main.tsx`** — wraps `<App />` in `<QueryClientProvider client={queryClient}>` so every hook shares that client (and therefore the one `['masterScores']` cache entry).

## Testing

- `masterScoreSelectors.test.ts` — every extractor against `sampleData`, covering both the hit and miss (`[]` / `undefined`) paths.
- `masterScoresGuard.test.ts` — well-shaped payloads pass through unchanged; non-objects, missing sections, and malformed `overall` all throw `MasterScoresError` carrying an `INVALID_DATA_SHAPE` code.
- `testFixtures.ts` — a compact but structurally complete `SuperstarsData` (2 players, 2 games covering both head-to-head and average-points formats, 1 year), so tests exercise the real contract without a full workbook.

There are no hook/network tests here; the pure layers carry the logic, and the hooks are deliberately trivial pass-throughs.
