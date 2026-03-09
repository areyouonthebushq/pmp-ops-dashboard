# CSV IMPORT DEMO READINESS

**Scope:** Audit of the current CSV import path for using a CSV as demo data in PMP OPS. No code changes in this pass.

---

## Expected columns

The importer does **not** enforce a fixed column list. It:

1. Treats the **first row as headers**.
2. **Lowercases and trims** each header (e.g. `Catalog` → `catalog`, `PRESS` → `press`).
3. Builds a row object: for each header `h`, `row[h] = (vals[i] || '').trim()`.
4. **Imports a row only if** `row.catalog || row.artist` (at least one is non-empty).
5. Creates a job with `id` (generated), `...row`, plus overrides: `status: row.status || 'queue'`, `assets: {}`, `progressLog: []`.

So the importer **accepts any CSV whose headers (after lowercase) match job property names**. It does not validate or drop unknown headers; extra keys are spread onto the job and may be ignored by the UI.

**Canonical job fields** (from FIELD_MAP and job usage across the app):

| Key (lowercase in CSV) | Used on floor / press cards / panel / QC |
|------------------------|------------------------------------------|
| catalog                | Floor table, press card, panel title, QC picker |
| artist                 | Floor table, press card, panel, QC picker |
| album                  | Floor table, panel subtitle |
| status                 | Floor table, stats, filters, press card, panel, QC (pressing/assembly list) |
| press                  | Floor, press cards (assignment), panel, station |
| qty                    | Floor table, press card, panel, progress logic |
| format                 | Floor table, press card |
| color                  | Floor table, press card |
| weight                 | Panel (and export) |
| due                    | Floor table, press card due label, overdue filter |
| location               | Floor table, floor card, panel, search |
| invoice, client, email, specialty, labelType, sleeve, jacket, outer_pkg, cpl, invDate, deposit, inv2, pay2, lastContact | Panel (billing/other) |
| notes, assembly        | Panel, floor card quick-edit |

---

## Mapping table

| Your CSV header (any case) | After import (job key) | Maps cleanly? | Notes |
|----------------------------|------------------------|---------------|-------|
| Catalog, CATALOG, catalog | catalog                | Yes           | Primary identifier for duplicate check. |
| Artist, ARTIST, artist     | artist                 | Yes           | Required (with catalog) for row to import. |
| Album, ALBUM, album       | album                  | Yes           | |
| Status, STATUS, status     | status                 | Yes           | Must be one of: `queue`, `pressing`, `assembly`, `hold`, `done`. Default if missing: `queue`. |
| Press, PRESS, press       | press                  | Yes           | **Must match exactly** (after trim): `PRESS 1`, `PRESS 2`, `PRESS 3`, `7" PRESS`. Case-sensitive. |
| Qty, QTY, qty             | qty                    | Yes           | Stored as string; parsed for display/progress. |
| Format, format            | format                 | Yes           | e.g. LP, 7" (7" in CSV may need quoting). |
| Color, color              | color                  | Yes           | |
| Weight, weight            | weight                 | Yes           | |
| Due, due                  | due                    | Yes           | **Recommended:** `YYYY-MM-DD` for date inputs. |
| Location, location        | location               | Yes           | |
| Notes, notes              | notes                  | Yes           | |
| Assembly, assembly        | assembly               | Yes           | |
| Invoice, Client, etc.     | invoice, client, …     | Yes           | Any FIELD_MAP key (see core.js) maps if header matches (lowercase). |

Export adds columns that are **not** first-class job fields; they are computed or for display only. If present in your CSV they are still spread onto the job but **not** used for progress or assignment:

| Export-only / computed | On import |
|------------------------|-----------|
| OVERAGE_10PCT          | → job.overage_10pct (ignored by app logic) |
| PRESSED                | → job.pressed (ignored; progress comes from progressLog) |
| QC_PASSED              | → job.qc_passed (ignored) |
| REJECTED               | → job.rejected (ignored) |

So you can **omit** these in your demo CSV; they add no behavior.

---

## Missing / ignored columns

- **Missing columns:** Any job field you don’t include will be `undefined` on the job. The UI shows "—" or empty for missing catalog/artist/album/format/color/qty/status/due/location; the panel shows empty inputs. No import error.
- **Ignored (extra) columns:** Headers that don’t match a job key (e.g. `OrderDate`, `Internal_ID`) become `job.orderDate`, `job.internal_id`. They are stored but not shown in floor/panel/press/QC. Safe to leave in for your own reference.
- **Overwritten by importer:** For every row the importer **always** sets `assets: {}` and `progressLog: []`. So you cannot pre-load assets or progress via CSV; those will be reset.

---

## Demo risks

1. **Press assignment (high)**  
   Press is matched by **exact string**: `S.presses.find(p => p.name === (j.press || '').trim())`.  
   Valid values: **`PRESS 1`**, **`PRESS 2`**, **`PRESS 3`**, **`7" PRESS`**.  
   If your CSV has `Press 1`, `press 1`, or `P1`, the job will have `job.press` set but **no** `setAssignment` will run, so the job **won’t show on the press card**.  
   **Mitigation:** Normalize your CSV so the press column uses exactly those four strings.

2. **Status values (medium)**  
   Status must be one of: `queue`, `pressing`, `assembly`, `hold`, `done`.  
   If you use something else (e.g. `Queued`, `In Progress`), the job will still import but filters (Active = pressing/assembly, Queued = queue, etc.) and QC job list (pressing/assembly) will not treat it as expected.  
   **Mitigation:** Use lowercase status values exactly as above.

3. **Duplicate detection (medium)**  
   Duplicates are detected **only by catalog**: if a job already in `S.jobs` has the same `catalog` (case-insensitive), the row is **skipped** and a console warning is logged. Same artist+album but different catalog will import as a second job.  
   **Mitigation:** Ensure catalog numbers are unique in your CSV if you don’t want duplicates.

4. **Dates (low)**  
   Due date is used for display and overdue filter. The app expects values that `new Date(j.due)` can parse. **Recommended:** `YYYY-MM-DD`.  
   **Mitigation:** Use ISO-style dates in your CSV.

5. **Qty (low)**  
   Stored as string; parsed with `parseInt(j.qty, 10)` for display and progress. Non-numeric or empty is treated as 0/empty.  
   **Mitigation:** Use integer-looking values (e.g. `500`, `1000`).

6. **7" PRESS (low)**  
   The name contains a double quote. In CSV you must quote the field (e.g. `"7"" PRESS"` or `"7\" PRESS"` depending on parser).  
   **Mitigation:** Check that one row with `press = 7" PRESS` imports and appears on the 7" press card.

---

## Exact smallest changes needed before import

**In your CSV (no code changes):**

1. **Headers**  
   Use at least: `catalog` (or `Catalog`) and `artist` (or `Artist`) so each row is not skipped. Prefer the same header names as export (e.g. CATALOG, ARTIST, ALBUM, STATUS, PRESS, QTY, FORMAT, COLOR, DUE, LOCATION) so they map to the same keys.

2. **Press column**  
   Replace any press labels with exactly: `PRESS 1`, `PRESS 2`, `PRESS 3`, or `7" PRESS` (with the quote escaped in CSV).

3. **Status column**  
   Use exactly: `queue`, `pressing`, `assembly`, `hold`, or `done` (all lowercase).

4. **Dates**  
   Use `YYYY-MM-DD` for `due` (and any other date columns if you add them).

5. **Catalog uniqueness**  
   Ensure no two rows share the same catalog if you want to avoid duplicates; otherwise the second row is skipped.

6. **Optional but recommended**  
   Include `qty`, `format`, `color`, `due`, `location` so floor table and press cards look convincing. At least one or two jobs with `status` = `pressing` and a matching `press` so press cards and “Active” filter show work.

No application code changes are required for the above; only CSV content and format.

---

## Recommended cleaned CSV format for demo

Minimal header set that makes floor, press cards, panel, and QC look good:

```text
catalog,artist,album,status,press,qty,format,color,weight,due,location,notes
```

Example rows (press names exact; status lowercase):

```text
catalog,artist,album,status,press,qty,format,color,weight,due,location,notes
DEMO001,Demo Artist,First Album,pressing,PRESS 1,500,LP,Black,180g,2026-04-15,Bay A,Demo job on Press 1
DEMO002,Another Band,Second LP,queue,,300,LP,Clear,140g,2026-05-01,,Queued no press
DEMO003,QC Test Band,QC Album,pressing,PRESS 2,200,LP,Black,180g,2026-04-20,Rack 2,For QC demo
```

- **Row 1:** Shows on PRESS 1, in “Active” and “On press” filters, and on the floor table and press card.
- **Row 2:** Queued, no press; appears in “Queued” and floor table only.
- **Row 3:** Shows on PRESS 2 and in QC job list (pressing).

Optional: add `invoice`, `client`, `specialty` if you want the right-side panel to look fuller. Avoid export-only columns (OVERAGE_10PCT, PRESSED, QC_PASSED, REJECTED) unless you re-export; they don’t affect behavior.

---

## Summary

| Question | Answer |
|----------|--------|
| Columns importer expects? | Any; first row = headers (lowercased). Row imported if `catalog` or `artist` present. |
| Columns that map cleanly? | All FIELD_MAP keys (catalog, artist, album, status, press, qty, format, color, due, location, notes, etc.) when header (lowercase) matches. |
| Columns ignored? | Extra headers become job props but are not used in floor/panel/press/QC. PRESSED, QC_PASSED, REJECTED, OVERAGE_10PCT from export are stored but not used. |
| Required for convincing demo? | catalog, artist; status (exact: queue/pressing/assembly/hold/done); press (exact: PRESS 1/2/3 or 7" PRESS) for “on press”; qty, format, color, due, location recommended. |
| Duplicates? | Yes: duplicate catalog (case-insensitive) skips row; no artist+album duplicate check. |
| Active orders? | Yes: jobs with `status !== 'done'` appear in floor and filters; `pressing`/`assembly` = Active. |
| Assigned presses? | Yes: if `press` matches a press name exactly, `setAssignment` runs and job shows on that press card. |
| Data cleaning before import? | Normalize: press = exact PRESS 1/2/3/7" PRESS; status = lowercase queue/pressing/assembly/hold/done; dates YYYY-MM-DD; unique catalog if you want no duplicates. |

No code changes recommended in this audit; only CSV content and format adjustments as above.
