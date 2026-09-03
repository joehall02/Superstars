# Google Cloud Bucket Setup (Superstars)

A zero-to-working guide for the two GCS buckets this app uses (plan §2.4).

This reflects current GCS docs: buckets now default to **uniform bucket-level
access**, so ACLs are legacy and everything below uses IAM.

## Key concept: how "public" and "private" work now

GCS no longer uses per-object ACLs by default. Modern access is:

- **Uniform bucket-level access (UBLA)** — access is granted only via IAM at the
  bucket level (enable this on *both* buckets).
- **Public access prevention (PAP)** — a switch that *blocks* `allUsers` from ever
  being added. It must be **enforced** on the private bucket and **disabled** on
  the public bucket.
- **Public** = grant `allUsers` the `roles/storage.objectViewer` IAM role.
  **Private** = grant only your service account that same role.

How this maps to the app code:

- `api/convert-data.ts` reads `spreadsheet/<SOURCE_FILE_NAME>` from the private
  bucket using `JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)` as credentials.
- The frontend loads configs/images from `VITE_GCS_PUBLIC_BASE_URL`.

---

## Step 0 — One-time project & CLI setup

1. Create/select a project at [console.cloud.google.com](https://console.cloud.google.com)
   and note the **Project ID**.
2. Install the CLI ([gcloud install docs](https://docs.cloud.google.com/sdk/docs/install))
   — `gcloud storage` replaces the old `gsutil`.
3. Authenticate and target your project:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable storage.googleapis.com
```

Pick globally-unique bucket names (location is permanent once set). Below uses
`superstars-private` and `superstars-public` — replace them.

---

## Step 1 — Create the PRIVATE bucket (spreadsheet)

```bash
gcloud storage buckets create gs://superstars-private \
  --location=EU \
  --uniform-bucket-level-access \
  --public-access-prevention
```

- `--uniform-bucket-level-access` → IAM only, no ACLs.
- `--public-access-prevention` → hard guarantee it can never be exposed publicly.
- Choose a `--location` near your Vercel region (e.g. `EU`, `US`, or a single
  region like `europe-west2`).

---

## Step 2 — Create the service account (Vercel's identity)

```bash
gcloud iam service-accounts create superstars-vercel \
  --display-name="Superstars Vercel"
```

Its email will be `superstars-vercel@YOUR_PROJECT_ID.iam.gserviceaccount.com`.

Grant it **read-only** access to the private bucket only (bucket-scoped, not
project-wide):

```bash
gcloud storage buckets add-iam-policy-binding gs://superstars-private \
  --member="serviceAccount:superstars-vercel@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

Create the JSON key that becomes `GCS_SERVICE_ACCOUNT_KEY`:

```bash
gcloud iam service-accounts keys create superstars-key.json \
  --iam-account=superstars-vercel@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

⚠️ `superstars-key.json` is a live credential — never commit it. Delete the local
copy after adding it to Vercel (Step 6).

---

## Step 3 — Create the PUBLIC bucket (images + configs)

Public read requires PAP **off**:

```bash
gcloud storage buckets create gs://superstars-public \
  --location=EU \
  --uniform-bucket-level-access \
  --no-public-access-prevention
```

Make it publicly readable:

```bash
gcloud storage buckets add-iam-policy-binding gs://superstars-public \
  --member="allUsers" \
  --role="roles/storage.objectViewer"
```

Objects are now readable at `https://storage.googleapis.com/superstars-public/<path>`
— this is your `GCS_PUBLIC_BASE_URL`.

---

## Step 4 — CORS on the public bucket

The browser fetches configs (and image requests) cross-origin, so the public
bucket needs a CORS policy. We allow all origins (`*`) — the bucket is already
public-read and Vercel preview URLs are dynamic; see the CORS entry in
[technical-decisions.md](../technical-decisions.md) for the full rationale.
Create `gcs-cors.json` (an array, **no** `"cors"` wrapper):

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it:

```bash
gcloud storage buckets update gs://superstars-public --cors-file=gcs-cors.json
gcloud storage buckets describe gs://superstars-public --format="default(cors_config)"  # verify
```

---

## Step 5 — Upload assets (matches the planned structure)

```bash
# Private: spreadsheet → api/convert-data.ts reads spreadsheet/<SOURCE_FILE_NAME>
gcloud storage cp data/master-scores.xlsx gs://superstars-private/spreadsheet/

# Public: configs + images
gcloud storage cp public/configs/*.json                                                  gs://superstars-public/configs/
gcloud storage cp $(find assets/players -maxdepth 1 -type f -not -name '.gitkeep')       gs://superstars-public/players/
gcloud storage cp $(find assets/games -maxdepth 1 -type f -not -name '.gitkeep')         gs://superstars-public/games/
gcloud storage cp $(find assets/games/icons -maxdepth 1 -type f -not -name '.gitkeep')   gs://superstars-public/games/icons/
```

Quick sanity check (should return the JSON): open
`https://storage.googleapis.com/superstars-public/configs/images.json` in a browser.

### Bucket structure & naming conventions

```
gs://superstars-private/
└── spreadsheet/
    └── <SOURCE_FILE_NAME>.xlsx      # read by api/convert-data.ts

gs://superstars-public/
├── configs/                         # images.json, localisation.json, stats.json, layout.json
├── players/                         # player icon/avatar images (keyed by player id)
├── games/                           # game images (keyed by game id)
└── games/icons/                     # game icons (mobile scrollbar indicators)
```

- Object paths are referenced by the config files (keyed by id), so keep filenames
  stable and lowercase.
- Public URLs are always `${GCS_PUBLIC_BASE_URL}/<path>`.

---

## Step 6 — Wire up environment variables

**Vercel** (Project → Settings → Environment Variables) — all server-only except
the `VITE_`-prefixed one:

| Variable | Value |
|---|---|
| `GCS_PRIVATE_BUCKET` | `superstars-private` |
| `GCS_SERVICE_ACCOUNT_KEY` | *paste the entire contents of `superstars-key.json`* |
| `VITE_GCS_PUBLIC_BASE_URL` | `https://storage.googleapis.com/superstars-public` |

The code does `JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)`, so paste the raw
JSON as a single value (Vercel handles the newlines). Then delete the local key:

```bash
rm superstars-key.json
```

---

## Step 7 — Verify end-to-end

- **Private path:** hit `/api/convert-data` on a Vercel preview — it should
  download the spreadsheet via the service account and return converted JSON.
- **Public path:** load the deployed app and confirm configs/images load from
  `storage.googleapis.com` with no CORS errors in the console.

---

## Security recap

- Private bucket: PAP enforced, only `superstars-vercel` has `objectViewer`.
  Never `allUsers`.
- Public bucket: read-only for `allUsers` — never grant write/admin publicly.
- Service account: `objectViewer` (read), never `objectAdmin`. Scoped to the
  private bucket, not the project.
- Rotate the key periodically; consider
  [Workload Identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation)
  later to eliminate the long-lived key entirely.

---

## Sources

- [Create a bucket — Cloud Storage](https://docs.cloud.google.com/storage/docs/creating-buckets)
- [About Cloud Storage buckets](https://docs.cloud.google.com/storage/docs/buckets)
- [Uniform bucket-level access](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access)
- [Public access prevention](https://docs.cloud.google.com/storage/docs/public-access-prevention)
- [Making data public / granting allUsers](https://docs.cloud.google.com/storage/docs/access-control/making-data-public)
- [Set up and view CORS configurations](https://docs.cloud.google.com/storage/docs/using-cors)
- [CORS configuration examples](https://docs.cloud.google.com/storage/docs/cors-configurations)
- [Create service accounts (IAM)](https://docs.cloud.google.com/iam/docs/service-accounts-create)
- [Create and delete service account keys](https://docs.cloud.google.com/iam/docs/keys-create-delete)
- [Service accounts overview](https://docs.cloud.google.com/iam/docs/service-account-overview)
- [Workload Identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation)
- [gcloud CLI install](https://docs.cloud.google.com/sdk/docs/install)
- [How to Create and Configure GCS Buckets Using the gcloud CLI (OneUptime, Feb 2026)](https://oneuptime.com/blog/post/2026-02-17-how-to-create-and-configure-google-cloud-storage-buckets-using-the-gcloud-cli/view)
- [How to Enable and Configure Uniform Bucket-Level Access (OneUptime, Feb 2026)](https://oneuptime.com/blog/post/2026-02-17-how-to-enable-and-configure-uniform-bucket-level-access-in-google-cloud-storage/view)
- [How to Configure CORS Policies on GCS Buckets (OneUptime, Feb 2026)](https://oneuptime.com/blog/post/2026-02-17-how-to-configure-cors-policies-on-google-cloud-storage-buckets/view)
