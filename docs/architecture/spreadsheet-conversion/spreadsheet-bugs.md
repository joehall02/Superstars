# Spreadsheet Bugs & Quirks

Known defects and oddities in `Superstars - Master Scores.xlsx`, and what the converter does about each. The governing rule (see `conversion-architecture.md`): the JSON **mirrors the sheet verbatim** — the converter *accommodates* layout quirks so it can read the data faithfully, but it never *corrects* wrong values. Fix the numbers in the spreadsheet; the JSON follows on the next conversion.

Legend: **Accommodated** = code handles a layout/format quirk · **Mirrored** = wrong values flow into the JSON on purpose · **Invisible** = never reaches the JSON.

## 1. Bowls format change in 2024 — *Accommodated*

**The quirk:** Before 2024, Bowls points were typed into the year block's *second* score column (the "Ag" position under the merged Pts header). From 2024 the sheet switched to a head-to-head-style layout with points in the *first* score column — and its all-time Running Totals deliberately only count 2024 onwards.

**In the code:** `BOWLS_NEW_FORMAT_FROM` (consts) + `bowlsLegacyPoints()` (convertMasterScores): seasons before 2024 read points from the legacy column, falling back to the first if a row was entered the modern way. The all-time exclusion needs no special code — the sheet's own Running Totals rows are blank for pre-2024-only players, and blank rows are skipped.

## 2. Cards all-time rank bug (unanchored RANK.EQ) — *Mirrored*

**The bug:** The Cards sheet's all-time rank formula wasn't anchored with `$`, so each copied row ranks against a range slid one row lower. Result: two players show "1st", five show "2nd", ranks are neither unique nor contiguous, and the Overall all-time scores inherit the wrong ranks.

**In the code:** Nothing — mirrored by design. The JSON carries the sheet's buggy ranks until the sheet is fixed (`$GJ$7:$GJ$22` and re-copy down).

**Frontend consequence:** never validate that ranks are unique or contiguous. Legitimate ties also produce repeated ranks with skipped numbers.

## 3. One player's Overall year ranks point at the row above — *Invisible*

**The bug:** One roster row's 2024/2025/2026 year-rank display formulas on the Overall sheet reference the row above (`$LS$20` instead of `$21`), showing the neighbouring player's ranks.

**In the code:** Nothing needed. The converter reads the *numeric* total/rank columns, where that player is genuinely marked absent ("A"/`#VALUE!`) for those seasons — so they are simply omitted, and the display-column bug never reaches the JSON.

## 4. Ordinal suffix typos ("3th", "16rd") — *Invisible*

**The bug:** The Overall sheet's ordinal-suffix formula references a wrong cell for the "rd" check, producing strings like "3th".

**In the code:** Rank cells are parsed to numbers (`readCellRank` accepts any `st/nd/rd/th` suffix, or none), so the JSON carries numeric ranks and the typo cannot appear. Ordinal rendering is the frontend's job.

## 5. Pre-broken 2028–2030 blocks on the Overall sheet — *Mirrored (future hazard)*

**The bug:** The 2028–2030 year blocks were copy-pasted with shifted references (2028 reads 2027's helpers; one 2030 column is a hard `#REF!`).

**In the code:** Nothing — those years are empty today, so nothing is emitted. **Fix the formulas before entering 2028 data**, or the JSON will faithfully carry wrong values for those seasons.

## 6. "A" totals and #VALUE! ranks as absent markers — *Accommodated*

**The quirk:** The sheet marks players who didn't complete a season with the text "A", and its rank formulas error (`#VALUE!`) for absent players rather than being blank.

**In the code:** The lenient readers (`readComputedNumber`, `readCellRank` in utils) treat error cells and non-numeric markers as "no value here" — the row is omitted, never reported as a data error. Only *raw stat* cells are held to the strict numeric standard.

## 7. Cached float noise in averages — *Accommodated (cosmetic)*

**The quirk:** Cached formula results carry IEEE float artifacts (e.g. `8.8800000000000008` for a value the sheet displays as 8.88).

**In the code:** `round()` is applied to averages at the precision the sheet displays (2dp all-time, 1dp darts yearly). This changes representation, not values.

## 8. SheetJS parses garbage as CSV — *Accommodated*

**The quirk (library, not sheet):** `XLSX.read` rarely throws — random bytes come back as a single-sheet CSV workbook. Only structurally broken files (e.g. truncated zips) throw.

**In the code:** The required-sheets check doubles as the net: a garbage buffer fails with `MISSING_SHEET` errors; a truncated file fails with `CORRUPT_WORKBOOK`. Either way the caller gets a `ConversionErrors` object, never bad data.

## 9. Mislabelled headers — *No impact*

The all-time block on three game sheets is headed "2030" instead of "Running Totals", and a hidden Overall header spells Bar Footy as "Bar Soccar". The converter reads by column position, not headers, so these are cosmetic only.
