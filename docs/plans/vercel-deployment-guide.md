# Vercel Deployment Guide: Superstars

A step-by-step guide for hosting the Superstars app (Vite + React SPA with a
Node.js serverless function in `/api`) on Vercel. Covers the checklist items in
implementation plan section **5.3 Vercel Deployment**.

## How this app maps onto Vercel

| Piece | What Vercel does with it |
|-------|--------------------------|
| Vite SPA (`vite build` → `dist/`) | Served as static assets from the global CDN |
| `api/convert-data.ts` | Auto-detected as a Node.js Vercel Function at `/api/convert-data` — no config needed |
| React Router client routes (`/rankings`, `/games/:id`, …) | Need a SPA rewrite so deep links don't 404 |
| GCS private bucket | Read server-side inside the function via `GCS_SERVICE_ACCOUNT_KEY` |
| GCS public bucket | Fetched directly by the browser (already handled by CORS in §2.4) |

The function and the app are served from the **same origin** (`/api/*` on the
Vercel domain), so the app → function call needs **no CORS configuration**.
Vercel gives the filesystem (including `/api` functions) precedence over
`rewrites`, so the catch-all SPA rewrite below will not shadow `/api/convert-data`.

## Prerequisites

- [ ] Code pushed to a GitHub repo (Vercel deploys from Git)
- [ ] A Vercel account (Hobby is fine to start) — sign in with GitHub
- [ ] The GCS private-bucket **service account JSON** and the two bucket names/URLs (from §2.4)
- [ ] Values for the auth secrets (`SITE_PASSWORD`, `AUTH_SECRET`) from §2.1

---

## Step 1 — Add `vercel.json`

Create `vercel.json` at the repo root. Vercel already auto-detects the Vite
preset (build command `vite build`, output `dist`, install `npm install`), so
this file only needs the **SPA rewrite** — without it, refreshing or deep-linking
to `/rankings` returns a 404.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Notes:
- Do **not** set `cleanUrls: true` alongside this rewrite unless you also drop the
  `.html` extension in the rewrite (`/index.html` → `/`).
- The `/api/convert-data` function is served before this rewrite (filesystem
  precedence), so API requests are unaffected.
- Optional per-function tuning — the function only downloads a small `.xlsx` and
  parses it, so the plan-default duration is fine. If you ever need longer, add a
  `functions` block (memory is set in the dashboard when Fluid compute is on):

  ```json
  {
    "functions": {
      "api/convert-data.ts": { "maxDuration": 30 }
    }
  }
  ```

  See the max-duration limits per plan in the Vercel docs (linked in Sources).

---

## Step 2 — Import the project into Vercel

1. Vercel dashboard → **Add New… → Project** → import the GitHub repo.
2. On the configuration screen, confirm the auto-detected settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (`tsc -b && vite build`)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Root Directory:** repo root (leave as-is; the app is not in a subfolder)
3. Set the **Node.js version** (Project Settings → General → Node.js Version) to
   match local dev — this repo targets Node 24 (`@types/node: ^24`). Node 24 LTS
   is GA on Vercel for builds and functions.
4. **Do not deploy yet** — add environment variables first (Step 3), otherwise the
   first build inlines missing `VITE_` values.

---

## Step 3 — Configure environment variables

Vercel has three environment scopes: **Production** (deploys from `main`),
**Preview** (all other branches / PRs), and **Development** (`vercel env pull`
into `.env.local`). Add each variable in **Settings → Environment Variables**.

> **Build-time vs runtime:** `VITE_`-prefixed vars are inlined into the client
> bundle **at build time**, so they must exist before the build runs. The rest are
> read **at runtime** inside the serverless function.

> **Mark secrets Sensitive:** toggle **Sensitive** on for every credential
> (`GCS_SERVICE_ACCOUNT_KEY`, `SITE_PASSWORD`, `AUTH_SECRET`). Sensitive values are
> encrypted and can't be read back in the dashboard. Consider enabling
> *sensitive-by-default* under Settings → Security & Privacy.

### Server-only (runtime — no `VITE_` prefix, never reaches the browser)

| Variable | Value | Sensitive |
|----------|-------|:---------:|
| `GCS_PRIVATE_BUCKET` | Private bucket name (spreadsheet) | — |
| `GCS_SERVICE_ACCOUNT_KEY` | The full service-account JSON, on one line | ✅ |
| `SITE_PASSWORD` | Shared site password (§2.1 auth) | ✅ |
| `AUTH_SECRET` | HMAC signing secret for login tokens (§2.1) | ✅ |

`GCS_SERVICE_ACCOUNT_KEY` must be the entire JSON object as a single string — the
function does `JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)`. Paste it as the
raw value; do not wrap it in extra quotes.

### Client-exposed (build-time — `VITE_` prefix, safe to ship to browser)

| Variable | Value |
|----------|-------|
| `VITE_DATA_SOURCE` | `api` — production fetches from `/api/convert-data` |
| `VITE_GCS_PUBLIC_BASE_URL` | `https://storage.googleapis.com/<public_bucket_name>` |

Set these for **Production** (and Preview if you want previews to hit live data).
`VITE_DATA_SOURCE=api` is what routes the app to the serverless function instead
of the local `/data/master-scores.json`.

> Tip: after adding vars you can run `vercel env pull .env.local` locally to mirror
> the Development set (it auto-gitignores `.env.local`).

---

## Step 4 — Deploy and verify the function reaches GCS

1. Trigger the first deploy (the import flow deploys automatically once env vars
   are set, or push a commit to `main`).
2. Watch the **Build Logs** for a clean `vite build`.
3. Once live, verify each layer:
   - [ ] **Static app loads:** open the `*.vercel.app` URL — the SPA renders.
   - [ ] **Deep links work:** hard-refresh on `/rankings` and `/games` — no 404
     (confirms the SPA rewrite).
   - [ ] **Function + GCS work:** open `https://<deployment>/api/convert-data` — it
     should return the converted JSON (not a 500). A `500` with
     "Server is not configured to load data" means `GCS_PRIVATE_BUCKET` or
     `GCS_SERVICE_ACCOUNT_KEY` is missing/malformed.
   - [ ] **App data renders:** rankings/games tables populate (app → function → GCS
     end to end).
   - [ ] **Public assets load:** game images/icons resolve from
     `VITE_GCS_PUBLIC_BASE_URL` (check the browser network tab for 200s, no CORS
     errors — CORS is configured on the bucket in §2.4).
4. If the function errors, open **Vercel → Deployment → Functions / Logs** to read
   the runtime logs (the function `console.error`s the GCS failure cause).

---

## Step 5 — Add a custom domain

1. **Settings → Domains → Add Domain**, enter your domain.
2. If you add an apex domain (`example.com`), accept Vercel's prompt to also add
   `www` (Vercel redirects between them).
3. Configure DNS at your registrar with the values Vercel shows:
   - **Apex domain** (`example.com`): add an **A record** to Vercel's IP
     (Vercel displays the exact value, e.g. `76.76.21.21`).
   - **Subdomain** (`www.` or `app.`): add a **CNAME** to the project-specific
     target Vercel shows (e.g. `<hash>.vercel-dns-017.com`).
   - Alternatively, switch your domain to **Vercel nameservers** (required if you
     use a wildcard `*.` domain).
4. Wait for DNS to propagate; Vercel auto-verifies and **provisions HTTPS/SSL
   automatically** — no manual certificate step.

---

## Step 6 — Protect preview / non-production deployments

Preview deployments (branches, PRs) carry the same secrets as production and live
at shareable/guessable URLs. Gate them behind a Vercel login so only your team can
open them.

1. **Settings → Deployment Protection → Vercel Authentication → enable.**
2. Scope it to **all deployments except Production** (Production stays public on
   your custom domain; Preview/branch deploys now require a Vercel login to view).
3. Verify: open a preview URL in an incognito window — you should hit Vercel's
   auth wall instead of the app.

> This protects the *front door* of preview deployments. It's separate from the
> app's own `SITE_PASSWORD` gate (§2.1) — defence in depth. It does **not** apply
> to the production custom domain, which stays publicly reachable (and is gated by
> `SITE_PASSWORD`).

---

## Step 7 — Lock down production (do after first successful deploy)

This is plan section **5.3.1**. Once production is live and verified:

- [ ] Create a long-lived `develop` branch off `main`.
- [ ] Keep Vercel **Production** tracking `main` only (default). Branch pushes get
  **Preview** deployments automatically.
- [ ] Do routine work on `develop` / feature branches; release via PR
  `develop → main`.
- [ ] Protect `main` on GitHub: require the CI workflow to pass and require a PR
  (disallow direct pushes).

---

## Gotchas specific to this project

- **`xlsx` from a CDN tarball:** `package.json` pins
  `xlsx: https://cdn.sheetjs.com/...tgz`. Vercel's install step (`npm install`)
  fetches it like any dependency — no action needed, but if a build ever fails on
  install, confirm the CDN URL is reachable and the lockfile is committed.
- **Imports outside `/api`:** the function imports from `../lib`, `../shared`, and
  `./consts` / `./errors`. Vercel's bundler traces and includes these
  automatically — no `includeFiles` config required.
- **TypeScript function, zero config:** the Node.js runtime compiles `.ts` in
  `/api` directly; the default `(req, res)` handler signature the function already
  uses (`node:http` types) is supported natively.
- **`VITE_` values are baked in at build:** changing `VITE_GCS_PUBLIC_BASE_URL` or
  `VITE_DATA_SOURCE` requires a **redeploy**, not just an env-var save.

---

## Sources

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) — framework preset, SPA deep-linking rewrite, `VITE_` system env vars
- [Using the Node.js Runtime with Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js) — `/api` auto-detection, TypeScript support, `(request, response)` handler, Node versions, dependency install
- [Static Configuration with vercel.json](https://vercel.com/docs/project-configuration/vercel-json) — `rewrites`, `functions` (`maxDuration`, memory + Fluid compute note), `headers`, `cleanUrls`
- [Project Configuration](https://vercel.com/docs/project-configuration) — full list of `vercel.json` / project-settings overrides
- [Configuring a Build](https://vercel.com/docs/builds/configure-a-build) — build command, output directory, install command, root directory
- [Environment variables](https://vercel.com/docs/environment-variables) and [Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) — scopes, Sensitive flag, sensitive-by-default
- [Environments](https://vercel.com/docs/deployments/environments) — Production / Preview / Development
- [vercel env (CLI)](https://vercel.com/docs/cli/env) — `vercel env pull` into `.env.local`
- [Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) — apex A record vs subdomain CNAME, nameservers, auto SSL
- [Deployment Protection](https://vercel.com/docs/deployment-protection) — Vercel Authentication for gating preview/non-production deployments
- [Node.js 24 LTS is now GA for builds and functions](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions) — Node 24 availability
