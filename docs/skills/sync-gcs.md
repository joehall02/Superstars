# Skill: Update GCS Assets & Configs

Verifies local assets match the config, then outputs the GCS commands needed to sync everything to the buckets.

**Never run gcloud commands yourself — always output them for the user to run.**

---

## Step 1 — Verify expected folders and files exist

Check the following paths are present and non-empty:

| Folder | Tracked? | Contains |
|---|---|---|
| `public/configs/` | git tracked | `images.json`, `localisation.json`, `layout.json`, `stats.json` |
| `assets/games/` | not tracked | game images (`.jpg`, `.jpeg`, `.JPG`, etc.) |
| `assets/games/icons/` | not tracked | game icons (`.svg`) |
| `assets/players/` | not tracked | player images (`.jpg`, `.JPG`, etc.) |
| `data/` | not tracked | `Superstars - Master Scores.xlsx` |

If any folder is missing or empty, stop and tell the user what's missing before proceeding.

---

## Step 2 — Verify `images.json` matches actual asset filenames

Read the actual filenames from:
- `assets/games/` — game images
- `assets/games/icons/` — game icons
- `assets/players/` — player images

Then read `public/configs/images.json` and check:

1. **Extensions match exactly** (case-sensitive) — e.g. if the file is `air-hockey.JPG` the config must say `.JPG`, not `.jpg`
2. **No missing entries** — every file on disk has a corresponding entry in `images.json`; add a placeholder entry for any that don't
3. **Stale entries are allowed** — entries in `images.json` with no corresponding file on disk are fine (e.g. players whose images haven't been added yet); collect them and report to the user at the end

If there are extension or naming mismatches, update `public/configs/images.json` to reflect the actual filenames on disk.

---

## Step 3 — Output the GCS sync commands

Output the following commands for the user to run. Never execute them yourself.

**Public bucket — configs:**
```bash
gcloud storage cp public/configs/images.json gs://superstars-public/configs/
```
> Only include other config files (`localisation.json`, `layout.json`, `stats.json`) if the user indicates those have also changed.

**Public bucket — game images:**
```bash
gcloud storage cp $(find assets/games -maxdepth 1 -type f -not -name '.gitkeep') gs://superstars-public/games/
```
> Uses `find` to select only files directly in `assets/games/`, skipping the `icons/` subdirectory and `.gitkeep`.

**Public bucket — game icons:**
```bash
gcloud storage cp $(find assets/games/icons -maxdepth 1 -type f -not -name '.gitkeep') gs://superstars-public/games/icons/
```

**Public bucket — player images:**
```bash
gcloud storage cp $(find assets/players -maxdepth 1 -type f -not -name '.gitkeep') gs://superstars-public/players/
```

**Private bucket — spreadsheet:**
```bash
gcloud storage cp 'data/Superstars - Master Scores.xlsx' gs://superstars-private/spreadsheet/
```
> Only include this if the spreadsheet has changed.

---

## Notes

- `gcloud storage cp` overwrites existing objects — no extra flags needed for updates.
- GCS object paths are **case-sensitive** — filenames must match exactly.
- After uploading, do a hard refresh (`Ctrl+Shift+R`) in the browser to bust any cached config responses.
