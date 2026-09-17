# Caching

Every caching layer in the app, from the browser inward. They stack: a request for the
dataset can be answered by the React Query cache, the browser cache, the Vercel edge, a
warm-function memo, or — only as a last resort — a fresh GCS download + `xlsx` parse.

## The layers at a glance

Ordered by how close they sit to the user (earlier = cheaper, fewer things run):

| # | Layer | Scope / lifetime | What it saves | Where |
| --- | --- | --- | --- | --- |
| 1 | React Query cache | one browser session | re-fetching the dataset/config/images over the network | `src/queryClient.ts`, `src/services/**`, `src/hooks/image.ts` |
| 2 | Browser HTTP cache | per browser, revalidated each load | nothing on first paint (`max-age=0`), but backs SWR | `CACHE_CONTROL` in `api/consts.ts` |
| 3 | Vercel edge (CDN) cache | global, `s-maxage=86400` + SWR 7d | the function invocation entirely | `CACHE_CONTROL` response header |
| 4 | Warm-instance memo | one warm function instance, 5 min TTL | the GCS download + `xlsx` parse on edge-cache misses | `api/convert-data.ts` |

Layers 2–4 all key off the **one** endpoint, `GET /api/convert-data` (see
[data-endpoints](./data-endpoints.md)). Layer 1 is entirely client-side.

---

## 1. React Query — client-side, per session

The Superstars dataset is a single JSON that changes ~once a year, so within a session
there is nothing to gain from expiring or refetching it. The app-wide client
(`src/queryClient.ts`) reflects that with aggressive defaults:

```ts
staleTime: Infinity,          // never goes stale during the session
gcTime: Infinity,             // never garbage-collected
refetchOnWindowFocus: false,  // no background refetch on tab focus
retry: 1,
```

Three patterns build on this:

- **One dataset, one cache entry, many slices.** The whole dataset is fetched once under a
  single query key (`masterScoresKey = ['masterScores']`). Every `useMasterScores` hook
  reuses that entry and derives its view with React Query's `select`
  (`src/services/masterScores/useMasterScores.ts`), so there are no redundant fetches — a
  page that needs only the year champions still shares the one cached dataset. The config is
  cached the same way under `['config']` (`src/services/config/useConfigQuery.ts`).

- **Route-loader prefetch.** Entering any protected route fires `masterScoresLoader`
  (`src/router.tsx`), which warms the dataset cache fire-and-forget — navigation isn't
  blocked; pages render immediately and read from cache. Because `staleTime`/`gcTime` are
  `Infinity`, the fetch runs **exactly once per session** no matter how the user navigates.

- **Image blob cache.** `useCachedImage` (`src/hooks/image.ts`) fetches each image once,
  keyed on its URL, and returns a blob object URL that never re-hits the network. A player
  shown in both a table icon and a profile card shares a single request. Also
  `staleTime`/`gcTime` `Infinity`.

> Note: the fetchers (`src/services/fetchJson.ts`) don't cache — they're plain `fetch` +
> JSON parse. All client-side caching is React Query's doing.

## 2–3. HTTP `Cache-Control` — browser + Vercel edge

The success response carries one header (`api/consts.ts`):

```
Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800
```

Read as three separate instructions:

- **`max-age=0`** — the *browser* must revalidate on every load, so it never serves a stale
  copy we can't purge. First paint always checks with the edge.
- **`s-maxage=86400`** — the *Vercel edge* caches the response hard for 24h. A redeploy or
  cache purge busts it, which is the intended release mechanism for the yearly data update.
  On an edge hit, **the function never runs** — this is the common, cheapest path.
- **`stale-while-revalidate=604800`** — for 7 days past the `s-maxage` window the edge may
  serve the stale copy instantly while refreshing in the background, so users never wait on
  a cold revalidation.

**Only successful data responses get this header.** Failures (`500`) and
`ConversionErrors` passthroughs (`200`) are sent with no `Cache-Control`, so a transient
error is never cached at any layer (`api/convert-data.ts`).

**Edge cache keys on the full URL, including the query string.** That's the amplifier the
next layer exists to blunt: `GET /api/convert-data?x=<random>` misses the edge every time.

## 4. Warm-instance memo — the edge-bypass backstop

Because the edge keys on the full URL, a caller appending a random query string bypasses
layer 3 and forces a fresh GCS download + full `xlsx` parse on every request. The memo
bounds that cost (`api/convert-data.ts`):

```ts
const MEMO_TTL_MS = 5 * 60 * 1000;
let memo: { result: ConversionResult; expiresAt: number } | undefined;
```

The handler serves from `memo` while it's unexpired; otherwise it downloads, converts, and
repopulates it. Properties worth knowing:

- **Warm-instance only.** It lives in module scope, so it's shared across invocations on a
  warm function instance but does not survive a cold start. That's fine — it's a cost
  bound, not a correctness mechanism.
- **Successes only.** The download-failure path returns *before* the memo is written, so a
  transient GCS outage can never get pinned for the 5-minute TTL. (`ConversionErrors` is a
  valid converted result and *is* memoised — it's deterministic for the same bytes.)
- **No in-flight dedupe.** Several concurrent requests on a freshly-warm instance can each
  download once before the memo fills; acceptable for this traffic profile.

The memo is a cost bound, not a throttle. The actual per-client limit is a **Vercel
Firewall rate-limit rule** on path `/api/convert-data` (dashboard, no code) — that's the
layer that stops a determined caller hammering the bypass path. See
[security-tightening §1](../plans/security-tightening.md).

---

## Why the split works

Each layer covers a case the others can't:

- The **edge** handles the overwhelming common case (normal loads) for free — no function,
  no GCS.
- The **memo** catches the edge-bypass (`?x=<rand>`) so a cache-buster still can't force
  more than one GCS round-trip per 5 min per warm instance.
- The **firewall** caps a determined caller regardless of caching.
- **React Query** means that, once loaded, a user's whole session runs off in-memory data
  with zero further network traffic for the dataset.
