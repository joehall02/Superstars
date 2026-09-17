# Bundle Splitting

How the client build is split into chunks, and why. The goal is a smaller first
paint and stable, independently-cacheable vendor code — not a smaller total
payload, which is fixed by MUI.

## What we started with

`vite build` emitted a **single ~583 kB chunk** (185 kB gzip) and warned that
chunks over 500 kB hurt load performance. The heavy server-only libraries
(`xlsx` ~400 kB, `@google-cloud/storage`) are **not** in it — they live only in
`lib/` and `api/` (Vercel functions) and never reach the browser (see
[data-endpoints](./data-endpoints.md)). The 583 kB was the front end plus its UI
libraries, with **MUI + emotion as the bulk**.

## What ships now

Three eager chunks load on first paint; everything else is deferred:

| Chunk | Size | gzip | Loaded |
| --- | --- | --- | --- |
| `mui` | 243 kB | 79 kB | first paint |
| `vendor` (react, react-dom, react-query, react-router) | 302 kB | 95 kB | first paint |
| `index` (app shell) | 13 kB | 5 kB | first paint |
| `RankingsPage`, `GamesPage`, `GameDetailsPage`, `LoginPage`, `ErrorPage`, `NotFoundPage` | 0.1–4.2 kB each | — | on navigation |

Total over the wire is still **~174 kB gzip** — unchanged, because MUI is a fixed
cost. The win is *when* code loads and *how* it caches, not *how much*.

## The three mechanisms

### 1. Route-based lazy loading

Every page is loaded with `React.lazy` + a dynamic `import()`, so each becomes
its own chunk fetched only when the user navigates to that route. Pages export
named symbols but `React.lazy` needs a default, so the imports are adapted in
`src/pages/lazyPages.ts`:

```ts
export const RankingsPage = lazy(() => import('./RankingsPage').then((m) => ({ default: m.RankingsPage })));
```

These live in their own file, separate from `src/router.tsx`, because the
`react-refresh/only-export-components` lint rule forbids component definitions
sitting alongside a non-component export (`router`).

### 2. Suspense boundary

Each lazy route element is wrapped so navigation shows the existing
`<Loading />` spinner while its chunk downloads (`src/router.tsx`):

```ts
const withSuspense = (element: ReactNode) => <Suspense fallback={<Loading />}>{element}</Suspense>;
```

The route-loader prefetch (`masterScoresLoader`) is unaffected — it's attached to
the route, not the component, so the dataset still warms on entry (see
[caching §1](./caching.md)).

### 3. Vendor chunk split

Third-party code is pulled out of the app chunks and split in two so a MUI
upgrade doesn't bust the react-core cache, and neither re-downloads when app code
changes. Vite 8 runs on Rolldown, so this uses the native
`build.rolldownOptions.output.codeSplitting` API — `rollupOptions` and
`manualChunks`/`advancedChunks` are all deprecated aliases (`vite.config.ts`):

```ts
codeSplitting: {
	groups: [
		{ name: 'mui', test: /node_modules[\\/](@mui|@emotion|tss-react)[\\/]/ },
		{ name: 'vendor', test: /node_modules/ },
	],
},
```

Groups match in order, so `mui` is listed first to claim MUI/emotion/tss-react
before the catch-all `vendor` group takes the rest of `node_modules`.

The single-chunk case put all vendor code in one 546 kB blob that still tripped
the 500 kB warning; splitting MUI (243 kB) from the react core (302 kB) puts
every chunk under the threshold, so the warning clears legitimately rather than
being suppressed.

## What we didn't do

- **Raise `chunkSizeWarningLimit`** — zero-effort, but silences the warning
  without improving structure. 174 kB gzip is a healthy payload, so this is a
  defensible fallback if the chunking ever feels like more complexity than it's
  worth.
- **Trim/drop MUI** — the only lever that would cut *total* bytes, since MUI
  dominates. Not worth it: imports already tree-shake (per-path icons, v6+ barrel
  imports), and the rest of the stack is small.

## Refinements available but deferred

- **Hover-prefetch** — lazy loading trades initial size for a round-trip on
  navigation (a brief spinner on first visit to each page). react-router can
  prefetch a route's chunk on link hover to hide that latency.
- **Component-level lazy loading** — split heavy widgets *inside* a route that
  aren't visible on load (e.g. the `ProfileCard` modal). Route splitting can't
  reach code that lives within a route; this can.

## The takeaway

Route splitting controls *when* code loads, not the total. For this app the total
is dominated by shared vendor code that loads on first paint regardless, so the
gains here are deferral (five of six pages off the first load) and caching
(vendor chunks stable across deploys) — not a smaller payload, which isn't
achievable without dropping MUI.
