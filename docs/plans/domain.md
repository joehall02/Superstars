# Custom Domain: Porkbun → Vercel

Plan for buying a cheap domain at **Porkbun** and pointing it at the
Vercel-hosted Superstars app. Completes the **"Set up custom domain"** item in
implementation plan §5.3, and expands on Step 5 of `vercel-deployment-guide.md`.

## Approach (read first)

Unlike Cloudflare Registrar, Porkbun lets you set **any nameservers** on the
domain — so we **delegate DNS to Vercel** (set the domain's nameservers to
Vercel's). Vercel then manages DNS records + SSL end-to-end. No manual A/CNAME
records, no proxy/CDN caveats.

This all stays on Vercel's **free Hobby plan** — custom domains, Vercel DNS, and
auto SSL are included; only *commercial* use or exceeding usage limits requires Pro.

## Prerequisites

- [x] App already deployed to Vercel and reachable on its `*.vercel.app` URL (§5.3)
- [x] A Porkbun account

---

## Step 1 — Register the domain at Porkbun

- [x] Porkbun → search the name; pick a cheap TLD (`.xyz`/`.uk` cheapest, `.dev`/`.app` fit a web project, `.com` if available) — registered **super-stars.app**
- [x] Check out — free WHOIS privacy and free SSL are included; watch the **renewal** price, not just year-one
- [x] Domain lands in your account with Porkbun's default nameservers (we replace these in Step 3)

> `.dev`/`.app` are on the HSTS preload list (forced HTTPS) — fine here, Vercel serves HTTPS by default.

---

## Step 2 — Add the domain in Vercel

- [x] Vercel → project → **Settings → Domains → Add Existing**
- [x] Enter the **apex** (`super-stars.app`); accept the prompt to also add `www` (Vercel redirects `www` → apex)
- [x] Vercel detects the domain isn't on its nameservers yet and shows the **two Vercel nameservers** to set (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) — copy them

---

## Step 3 — Point Porkbun's nameservers at Vercel

- [x] Porkbun → **Domain Management** → expand the domain → **nameservers** (labelled "Authoritative Nameservers" / "NS"; on the management page, *not* the DNS-records editor)
- [x] Replace **all four** of Porkbun's default nameservers with the **two Vercel nameservers** from Step 2
- [x] Save

> This hands the whole DNS zone to Vercel. From here Vercel manages the apex/`www`
> records and SSL automatically — nothing to add by hand.

---

## Step 4 — Verify

- [x] Back in Vercel → Domains: wait for the domain to flip to **Valid Configuration** (usually minutes; nameserver propagation can take up to ~24–48h)
- [x] Vercel **auto-provisions HTTPS/SSL** — no manual certificate step (`.app` is HSTS-preloaded, so early cert-propagation gaps show as `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` in Chrome until the cert lands on every edge — resolves itself)
- [x] Open `https://super-stars.app` and `https://www.super-stars.app` — app loads, `www` redirects to apex, padlock is valid
- [x] Hard-refresh a deep link (`/rankings`, `/games`) — no 404 (SPA rewrite from `vercel.json` is doing its job)
- [x] Set the apex as the **Production domain** in Vercel so it's the canonical URL
- [x] Redirect the `*.vercel.app` URL → apex (set on the `.vercel.app` domain in Vercel → Domains)

---

## Alternative — keep DNS at Porkbun, add records manually

Only if you'd rather Porkbun stay the DNS host (e.g. you also run email/other
records there and don't want to move them to Vercel).

- [ ] Skip Step 3; in Vercel → Domains, choose the **A record / CNAME** config instead of nameservers
- [ ] Porkbun → **DNS Records**: add **A** `@` → Vercel's IP (e.g. `76.76.21.21`) and **CNAME** `www` → Vercel's target (e.g. `cname.vercel-dns.com`)
- [ ] Verify as in Step 4

---

## Sources

- [Porkbun](https://porkbun.com/) — registration, free WHOIS privacy, editable nameservers
- [Working with nameservers (Vercel)](https://vercel.com/docs/domains/working-with-nameservers) — delegating a domain to Vercel's nameservers
- [Adding & Configuring a Custom Domain (Vercel)](https://vercel.com/docs/domains/working-with-domains/add-a-domain) — apex vs `www`, auto SSL
- `docs/plans/vercel-deployment-guide.md` — Step 5 (generic domain), rest of the Vercel setup
