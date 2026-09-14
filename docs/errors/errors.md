# Example error responses

Sample payloads for visually checking the [Error Page](../../src/pages/ErrorPage.tsx) (plan §4.4)
by overriding the dataset network response in the browser — no broken spreadsheet required.

Override the URL the app fetches the dataset from:

- **dev / Docker** (`VITE_DATA_SOURCE=local`): `/data/master-scores.json`
- **production** (`VITE_DATA_SOURCE=api`): `/api/convert-data`

## How to override (Chrome / Edge DevTools)

1. DevTools → **Network** → tick **Enable Local Overrides** (or Sources → Overrides → select a folder).
2. Load any protected page so the dataset request fires.
3. Right-click the dataset request → **Override content**, paste one file's contents, and reload.

The failed fetch trips the central error gate in `ProtectedRoute`, which redirects to `/error`.
Firefox: use **Request Blocking** to 404 the request (triggers `FETCH_FAILED`), or a `responseHeaders`/local proxy to swap the body.

## Files

| File | Triggers | Shows |
|------|----------|-------|
| `corrupt-workbook.json` | `CORRUPT_WORKBOOK` | Single converter error with a `cause` context |
| `missing-sheet.json` | `MISSING_SHEET` | A required sheet absent from the workbook |
| `invalid-cell.json` | `INVALID_CELL` | A non-numeric stat cell |
| `player-name-mismatch.json` | `PLAYER_NAME_MISMATCH` | Roster vs. game-sheet name disagreement |
| `multiple-errors.json` | 4 converter errors | The details list rendering several rows |
| `invalid-data-shape.json` | `INVALID_DATA_SHAPE` | A well-formed-but-wrong payload caught by the frontend shape guard |

The first five are `ConversionErrors` payloads (`{ "errors": [...] }`) the converter returns when the
spreadsheet is bad. The last is a structurally-invalid dataset that passes the fetch but fails
`assertSuperstarsData`. To exercise `FETCH_FAILED` instead, block the request or return a non-200 status.
