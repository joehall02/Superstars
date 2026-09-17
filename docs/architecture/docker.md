# Docker (Production-like Local Testing)

The [`Dockerfile`](../../Dockerfile) builds a static, Nginx-served image for testing the production *bundle* locally — the real minified build behind a real web server, rather than the Vite dev server. It is **local-only** (never pushed to a registry); production is served by Vercel.

```bash
npm run docker:build   # docker build -t superstars .
npm run docker:run     # serves at http://localhost:8080
```

## What it mirrors — and what it doesn't

The image deliberately follows the **local** data path, not production. A [multi-stage build](../../Dockerfile) converts the master spreadsheet to JSON at build time (`npm run convert-data`) and builds with `VITE_DATA_SOURCE=local`, so the bundle fetches `/data/master-scores.json` (copied into `dist/data/` by `vite build`) instead of the Vercel serverless API. See the [Docker data-fetching decision](../technical-decisions.md#docker-data-fetching-strategy) for why there's no local serverless emulation.

| Concern | Production (Vercel) | Docker image |
| --- | --- | --- |
| Data source | `/api/convert-data` (GCS → serverless) | `/data/master-scores.json` (built-in, `VITE_DATA_SOURCE=local`) |
| Static hosting | Vercel platform | Nginx |
| SPA routing | `vercel.json` `rewrites` | `nginx.conf` `try_files` |
| Caching + security headers | `vercel.json` `headers` | `nginx.conf` + `nginx-security-headers.conf` |
| Images + remote configs | GCS public bucket | GCS public bucket (same) |

## Build stages

1. **`node:24-alpine` (build)** — `npm ci`, then `npm run convert-data` and `npm run build`. `HUSKY=0` skips the git-hook install (there's no `.git` in the build context).
2. **`nginx:alpine` (serve)** — copies only `dist/` plus the two Nginx configs. Nothing from the build stage's source tree (including `.env.production`) reaches this final image.

## Environment variables

`vite build` runs in production mode and **auto-loads `.env.production`** natively, so any `VITE_`-prefixed var is picked up with no build args. `.dockerignore` keeps `.env.production` in the build context (`!.env.production`) while still excluding `.env` and `.env.local`.

- **`VITE_GCS_PUBLIC_BASE_URL`** — the one var that actually matters here. Used to build image/icon URLs and to fetch configs from the GCS public bucket. Without it, configs fall back to the bundled `/configs` copy and images 404 — the scores themselves still work.
- **`VITE_DATA_SOURCE`** — forced to `local` via `ENV` in the Dockerfile. A real env var takes precedence over the `.env` file value in Vite, so this overrides `.env.production`'s `api`.
- **Server-only secrets** (`SITE_PASSWORD`, `GCS_PRIVATE_BUCKET`, `GCS_SERVICE_ACCOUNT_KEY`) are **not needed and not exposed**. They belong to the Vercel serverless functions, which don't run in this static image. Vite only inlines `VITE_`-prefixed vars into the bundle, so these never reach the client JS; and the multi-stage build keeps `.env.production` out of the final image entirely.

The only residue is that `.env.production` sits in the throwaway build-stage layer in your local build cache — acceptable for a local-only image on the same machine the file already lives on. If the image were ever pushed, the hardened alternative is BuildKit's `--mount=type=secret`.

**Prerequisite:** the build reads the master spreadsheet from `data/`, which is not committed — the file must be present locally. See [`docs/.env.example`](../.env.example) for variable definitions.

## Nginx configuration

Nginx is a bare web server with no app-specific knowledge, so [`nginx.conf`](../../nginx.conf) supplies what Vercel handles from `vercel.json`:

- **SPA fallback** — `try_files $uri $uri/ /index.html` so client-side routes (`/rankings`, `/games/:id`, hard refreshes) resolve to the app shell instead of 404ing. This is the Docker equivalent of `vercel.json`'s `rewrites`.
- **Caching** — immutable, year-long cache for fingerprinted `/assets/`; `no-cache` for the data/config JSON (stable path across builds) and the app shell.

### Security headers

[`nginx-security-headers.conf`](../../nginx-security-headers.conf) mirrors the header set from `vercel.json`'s `headers` block (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS). The CSP is byte-for-byte the production one, so anything CSP-blocked in production is blocked here too.
