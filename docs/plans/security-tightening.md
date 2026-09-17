# Security Tightening

Near-term hardening for the public production deployment. Scope is deliberately
narrow: the auth gate / login page (plan §2.1) is **deferred**, so this covers
the three items that stand on their own — endpoint abuse resistance, response
error hygiene, and HTTP security headers.

Origin recap: the app is a static SPA on Vercel + one serverless function
(`api/convert-data.ts`) that reads a private GCS bucket. There is currently no
auth, so every item below assumes anonymous public access.

---

## 1. Endpoint abuse resistance (`/api/convert-data`)

**Problem.** No rate limiting, plus a cache-bypass amplifier: Vercel's edge cache
keys on the **full URL including query string**, so `GET /api/convert-data?x=<rand>`
misses the edge cache on every request and forces a fresh GCS download + full
`xlsx` parse each time. One client can turn the one cheap endpoint into a
cost/latency amplifier.

**Fix — two layers, cheapest first:**

- [x] Warm-instance memo: cache the parsed result in module scope with a short TTL
  (e.g. 5 min) so repeated invocations on a warm function skip the GCS download +
  parse. Bounds cost even when the edge cache is bypassed.
- [x] Add a Vercel Firewall rate-limit rule (dashboard → Firewall → Configure → New
  Rule): **If** Request Path equals `/api/convert-data` → **Then** Rate Limit, Fixed
  Window, ~60 req / 60s, keyed by **IP**, action Default (429). Review Changes →
  Publish (live immediately, no redeploy). No code; the real per-client throttle.
  Available on Hobby (1 rate-limit rule / project); not Pro-only.
- [x] Keep the success `Cache-Control` header as-is (edge still absorbs the common
  case); the memo + firewall only cover the bypass path.

**Notes.**
- The memo is a warm-instance optimisation only — it does not persist across cold
  starts, which is fine; the firewall rule is what actually limits a determined
  caller.
- Don't try to "normalise away" the query string in the function — the edge cache
  decision happens before the function runs, so it can't help there. The firewall
  rule is the correct layer for that.
- Rate-limit counters are per-region, so aggregate traffic can exceed the configured
  limit — it bounds cost, it isn't a hard global cap. Consider action=Log first to
  watch the effect, then switch to Deny once the threshold looks right.

**Verify.**
- [x] `curl` the endpoint past the limit (e.g. ~80× within the window) with random
  `?x=` values; confirm the firewall rule starts returning 429s. Run against a
  deployment — `vercel dev` does not enforce firewall rules. Verified: 300 req →
  100 × 200 then 200 × 429 (limit is 100/60s per IP).
- [x] Confirm a normal load (no query string) still serves from the edge (fast, no
  function invocation in logs). Verified: `x-vercel-cache: HIT` with a rising `age`
  on repeat `curl`s → served from edge, function not invoked.

---

## 2. Response error hygiene (`api/errors.ts`)

**Problem.** `sourceUnavailableError` and `unexpectedError` attach
`context: { cause: <error message> }` to the 500 response body. GCS SDK errors can
carry bucket names, object paths, and auth detail. This contradicts the documented
"error hygiene" contract (`docs/architecture/data-endpoints.md` → *Error hygiene*:
client-facing messages are fixed and generic, real cause logged server-side only).

The client never even reads it — `jsonFetcher` (`src/services/fetchJson.ts`) throws
a generic error on any non-OK status and never touches the body. So the leak is
purely at the raw HTTP layer, and removing it has **zero** client impact.

**Fix.**
- [x] Drop `context` from the API error objects returned on the wire (or gate it
  behind a non-production check). Keep the generic `message`.
- [x] Keep the existing `console.error('…', cause)` in `api/convert-data.ts` — the
  real cause still lands in Vercel function logs for debugging.

**Verify.**
- [x] Force a 500 (unset `GCS_PRIVATE_BUCKET` locally via `vercel dev`); confirm the
  response body is `{ errors: [{ code, message }] }` with no `context`/`cause`.
  Verified via `vercel dev`: body was `{"errors":[{"code":"SOURCE_UNAVAILABLE","message":"…"}]}`.
- [x] Confirm the underlying cause still appears in the function log output.
  Verified: `Failed to load spreadsheet from GCS: Error: Server is not configured to load data` logged server-side.

---

## 3. HTTP security headers + CSP (`vercel.json`)

**Problem.** `vercel.json` sets only a rewrite — no security headers. Missing the
standard drive-by protections (clickjacking, MIME sniffing, mixed content) and a
Content-Security-Policy.

**Fix.** Add a `headers` block applying to all routes. Baseline set:

- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `X-Frame-Options: DENY` (belt-and-braces alongside CSP `frame-ancestors`)
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), midi=()` (deny features the app doesn't use; now expected for a top scanner grade in 2026)
- [x] `Content-Security-Policy` (see directives below)

**CSP directives** — derived from the app's actual origins:

| Directive | Value | Why |
| --- | --- | --- |
| `default-src` | `'self'` | baseline |
| `script-src` | `'self'` | Vite build emits external scripts only (`/loader.js`, bundled `main.tsx`); no inline `<script>` |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | emotion/MUI/tss-react inject runtime `<style>` tags → `'unsafe-inline'` required; Google Fonts stylesheet |
| `font-src` | `'self' https://fonts.gstatic.com` | Google Fonts files |
| `img-src` | `'self' data: blob: https://storage.googleapis.com` | player/game images from the public bucket; `data:` for inline; `blob:` because `useCachedImage` (`src/hooks/image.ts`) fetches images and serves them as `URL.createObjectURL` blob URLs |
| `connect-src` | `'self' https://storage.googleapis.com` | `fetch` to `/api/convert-data` (self) + configs/images from the public bucket |
| `frame-ancestors` | `'none'` | clickjacking |
| `base-uri` | `'self'` | |
| `object-src` | `'none'` | |
| `form-action` | `'self'` | |

**Notes.**
- `style-src 'unsafe-inline'` is unavoidable with emotion's default injection; a
  nonce-based CSP would require wiring an emotion cache with a nonce and is out of
  scope here.
- `storage.googleapis.com` appears in both `img-src` and `connect-src` because
  configs are `fetch`ed (connect) and images are `<img>` src (img). Keep both.
- If a custom domain later serves the public bucket, update those two origins.
- A blocked *inline script* seen in the console (UUID-named source, "use this hash"
  hint) is a browser-extension injection, not app code — the built `index.html`
  emits only external scripts. Do **not** loosen `script-src` for it. Confirmed a
  Firefox extension: it doesn't appear in Chromium, and Firefox private windows
  still run add-ons — use Help → Troubleshoot Mode to rule it out.

**Verify.**
- [x] Deploy to a preview; load the app and open DevTools console — no CSP
  violations on first paint, fonts, images, config fetch, or the data fetch.
  Verified: after adding `blob:` to `img-src`, the only remaining console entry is a
  Firefox-extension inline script (see note above), not app code.
- [x] Check response headers (`curl -I` the deployment) show all six headers.
  Verified: HSTS, X-Content-Type-Options, Referrer-Policy, X-Frame-Options,
  Permissions-Policy, and Content-Security-Policy all present.
- [ ] Run the deployment through a header scanner and confirm an A grade with no
  unexpected gaps (securityheaders.com reportedly shut down — use a current
  equivalent such as the Mozilla Observatory). Optional; not yet run.

---

## Out of scope (tracked elsewhere)

- Auth gate + login page (plan §2.1) — deferred by decision.
- GCS service-account key expiry/rotation — reconcile
  [`gcs-bucket-setup.md`](./gcs-bucket-setup.md) with the actual key expiry date in
  the Cloud Console.
