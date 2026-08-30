# Config Service

The config layer supplies the app's **presentational reference data** — game/player
images, per-game summaries and rules, stat-column labels, and navigation links. This
data is intentionally kept separate from the Superstars dataset (scores/rankings): it
changes independently, is authored by hand, and drives how the data is *displayed*
rather than *what* the data is.

It mirrors the functional shape of the `MasterScoreService`: a pure getter surface built
from fetched JSON, exposed to components through a React Context and thin per-slice hooks.

## The four config files

All four live in `public/configs/` so Vite serves them at `/configs/*.json` in dev and
bundles them into `dist/` for production. They are **git-tracked** (committed, not
gitignored) and double as the production fallback. Annotated example shapes live in
[`config-shape-examples/`](./config-shape-examples/).

| File | Type | Purpose |
|------|------|---------|
| `images.json` | `ImagesConfig` | Game image/icon and player icon paths, keyed by id. Paths are **relative** to the GCS public bucket. |
| `localisation.json` | `LocalisationConfig` | Per-game `summary` and `rules` text, keyed by game id. |
| `stats.json` | `StatsConfig` | Reusable stat-label groups + per-game references + overall-ranking labels. Drives dynamic table columns. |
| `layout.json` | `LayoutConfig` | Ordered navigation links driving both Navbar and Footer. |

The file list and enum values are centralised in [`src/enums/config.ts`](../../../src/enums/config.ts)
(`ConfigFile`) and iterated via `CONFIG_FILES` in [`src/config.ts`](../../../src/config.ts).

### `stats.json` — the indirection worth calling out

`stats.json` doesn't map a game straight to its labels. It defines **reusable stat
groups** once, then each game references a group *per ranking type* (`allTime` / `byYear`):

```jsonc
{
  "statGroups": { "headToHead": { "played": "Played", "wins": "Wins", ... } },
  "games":      { "g_3": { "allTime": "headToHead", "byYear": "bowlsYear" } },
  "overall":    { "allTime": { "score": "Score" }, "byYear": { "totalGameRanks": "Total Ranks" } }
}
```

Key **iteration order defines table column order**, so `getStatLabels` preserving order
is load-bearing (see the test). `overall` is separate because the non-game "overall"
rankings can't be expressed as a game id — hence the dedicated `getOverallStatLabels`.

## Fetching & environment resolution

`getConfigBaseUrl()` in [`src/config.ts`](../../../src/config.ts) resolves where configs
are fetched from, using Vite's built-in `import.meta.env.DEV`:

- **dev** → `/configs` (the local copy served by Vite; `LOCAL_CONFIG_BASE`).
- **prod** → `${VITE_GCS_PUBLIC_BASE_URL}/configs`, falling back to `/configs` when
  `VITE_GCS_PUBLIC_BASE_URL` is unset so the bundled copy still works.

`VITE_GCS_PUBLIC_BASE_URL` **must** be `VITE_`-prefixed because image URLs and prod config
fetches are constructed client-side in the browser. `getPublicAssetBaseUrl()` exposes the
same base for image/icon URLs

`fetchAppConfig()` in [`fetchConfig.ts`](../../../src/services/config/fetchConfig.ts):

1. Fetches all four files in parallel from the resolved base.
2. Validates the combined payload with `assertAppConfig`.
3. **Fallback:** if the resolved base wasn't already `/configs` (i.e. we tried GCS in
   prod) and the fetch/validation fails, it retries once against the bundled local copy.
   A GCS bucket outage therefore doesn't break the app.
4. Any remaining failure throws a `ConfigError` for the Error Page.

## Validation & errors

`assertAppConfig()` in [`configsGuard.ts`](../../../src/services/config/configsGuard.ts)
is a **pragmatic top-level shape guard** — it checks only the structural skeleton the app
relies on (`images.games`/`images.players`, `localisation.games`,
`stats.{statGroups,games,overall}`, `layout.navLinks` is an array), not every entry. The
goal is to fail fast with a clear `ConfigError` instead of a confusing runtime error deep
inside a component.

Error plumbing is **shared with the Superstars data layer** so both produce consistent,
machine-readable errors ([`loadErrors.ts`](../../../src/services/loadErrors.ts),
[`fetchJson.ts`](../../../src/services/fetchJson.ts)):

- `jsonFetcher(resource, ErrorCtor)` — shared fetch+parse; throws a `FETCH_FAILED`
  `DataLoadError` on network failure / non-OK response.
- `invalidShapeThrower(resource, ErrorCtor)` — shared rejecter for shape guards; throws an
  `INVALID_DATA_SHAPE` `DataLoadError`.
- The `resource` (`DataLoadResource.Config`) names what failed; the `ErrorCtor`
  (`ConfigError`) lets config and data throw distinct error types from one implementation.
- `ConfigError` is the config counterpart to `MasterScoresError` — it carries the
  underlying `DataLoadError[]` so the Error Page (4.4) can render details.

## The service surface

`createConfigService(config)` in
[`configService.ts`](../../../src/services/config/configService.ts) is a **functional
factory** (arrow getters over the loaded `config`, not a class), matching `MasterScoreService`.

| Getter | Returns |
|--------|---------|
| `getGameImage(gameId)` | Full URL (GCS base + relative path) for a game image, or `undefined` |
| `getGameIcon(gameId)` | Full URL for a game icon, or `undefined` |
| `getPlayerIcon(playerId)` | Full URL for a player icon, or `undefined` |
| `getGameLocalisation(gameId)` | `{ summary, rules }`, or `undefined` |
| `getStatLabels(gameId, type)` | Stat labels for a game's `allTime`/`byYear` table (resolves game → group → labels), `{}` if missing |
| `getOverallStatLabels(type)` | Stat labels for the non-game "overall" rankings, `{}` if missing |
| `getNavLinks()` | The ordered `NavLink[]` |

Two design rules the getters uphold:

- **Image getters prepend the GCS base URL** (via `toAssetUrl`); the rest return the raw
  config slice.
- **Missing ids resolve to `undefined`/empty, never throw** — a config gap degrades a
  single element rather than crashing the page. Every getter is covered in
  [`configService.test.ts`](../../../src/services/config/configService.test.ts).

Types live in [`src/types/config.types.ts`](../../../src/types/config.types.ts)
(`AppConfig`, `ConfigService`, and the per-file shapes).

## Wiring into React

- **`useConfigQuery()`** ([`useConfigQuery.ts`](../../../src/services/config/useConfigQuery.ts)) —
  React Query hook under the single key `['config']`. The whole config is fetched once and
  cached for the app's lifetime.
- **`ConfigProvider`** ([`configProvider.tsx`](../../../src/context/configProvider.tsx)) —
  runs the query, `useMemo`s the `ConfigService` from the loaded data, and provides it via
  `ConfigContext`. It **sits above the router**, so it renders a self-contained
  `<Loading />` / `<Error />` fallback rather than redirecting to the routed Error Page
  (routing config failures to `/error` is deferred to 4.4).
- **`useConfig()` + per-slice hooks** ([`src/hooks/config.ts`](../../../src/hooks/config.ts)) —
  `useConfig()` reads the context (throwing if used outside the provider; the provider
  gates render until loaded, so it returns a ready service synchronously). Thin per-slice
  hooks (`useGameImage`, `useGameIcon`, `usePlayerIcon`, `useGameLocalisation`,
  `useStatLabels`, `useOverallStatLabels`, `useNavLinks`) let a component depend on just
  its slice without touching the whole service surface.

The service barrel is [`src/services/config/index.ts`](../../../src/services/config/index.ts).

## Who consumes what

| Consumer | Getters / hooks |
|----------|-----------------|
| Navbar & Footer | `getNavLinks()` |
| Rankings Page | `getPlayerIcon(playerId)`, `getOverallStatLabels(type)` |
| Games Page | `getGameImage(gameId)`, `getGameIcon(gameId)` |
| Game Details Page | `getGameImage`, `getGameIcon`, `getGameLocalisation`, `getStatLabels(gameId, type)` |

## Related

- Implementation checklist: [`docs/implementation-plan.md`](../../implementation-plan.md) §2.3.
- Data-layer counterpart: `MasterScoreService` — the config layer deliberately mirrors its
  functional-selector + hooks pattern and shares the fetch/error plumbing.
