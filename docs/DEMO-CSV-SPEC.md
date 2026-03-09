# Demo CSV import spec

Use this before demo day to prepare a CSV that imports correctly and looks good on floor, press cards, panel, and QC.

---

## 1. Exact required columns for demo

Every row must have **at least one** of these (or the row is skipped):

| Column   | Header (any case) | Notes |
|----------|-------------------|--------|
| catalog  | catalog, Catalog, CATALOG | Used for duplicate check (case-insensitive). |
| artist   | artist, Artist, ARTIST | With catalog, row is imported. |

So: **catalog** and **artist** are the only required columns. For a convincing demo you also need **status** and (for jobs on press) **press** with exact values below.

---

## 2. Exact allowed values for status

Use **exactly** one of these (lowercase). Anything else will import but won’t match filters or QC list.

| Value      | Effect in app |
|------------|----------------|
| queue      | Queued; appears in “Queued” filter. |
| pressing   | On press; appears in “Active” and “On press”; shows in QC job list. |
| assembly   | In assembly; appears in “Active”; shows in QC job list. |
| hold       | On hold. |
| done       | Completed; excluded from floor “open” counts and most filters. |

Default if column missing: **queue**.

---

## 3. Exact allowed values for press

Press is **case-sensitive** and must match one of these exactly (after trim):

| Value      |
|------------|
| PRESS 1    |
| PRESS 2    |
| PRESS 3    |
| 7" PRESS   |

Wrong examples (job will **not** show on press card): `Press 1`, `press 1`, `P1`, `7" Press`.  
For **7" PRESS** in CSV, quote the field and escape the quote, e.g. `"7"" PRESS"`.

---

## 4. Optional but recommended fields

These make the floor table, press cards, and panel look convincing:

| Column   | Example values | Notes |
|----------|----------------|-------|
| album    | Album Title    | Floor and panel. |
| qty      | 500, 1000      | Integer-like string. |
| format   | LP, 7"         | Floor and press card. |
| color    | Black, Clear   | Floor and press card. |
| weight   | 180g, 140g     | Panel. |
| due      | 2026-04-15     | Use YYYY-MM-DD. |
| location | Bay A, Rack 2  | Floor and search. |
| notes    | Free text      | Panel and floor card. |

---

## 5. Fields ignored by the app after import

Stored on the job but **not** used for display or logic:

- **OVERAGE_10PCT** (from export)
- **PRESSED** (progress comes from progressLog)
- **QC_PASSED**
- **REJECTED**

Any other header that doesn’t match a job key becomes an extra property and is not shown in floor/panel/press/QC. Safe to leave in or omit.

---

## 6. Common CSV mistakes that make the demo look broken

| Mistake | What happens | Fix |
|---------|----------------|-----|
| Press = `Press 1` or `press 1` | Job has press text but **does not** show on press card. | Use exactly `PRESS 1`, `PRESS 2`, `PRESS 3`, or `7" PRESS`. |
| Status = `Queued` or `In Progress` | Job doesn’t match “Active” or “Queued” filters; QC list may be empty. | Use lowercase: `queue`, `pressing`, `assembly`, `hold`, `done`. |
| Duplicate catalog in CSV | Second row is skipped (console warning). | Use unique catalog per row. |
| Due date in wrong format | Overdue filter or display may be wrong. | Use `YYYY-MM-DD`. |
| No pressing/assembly jobs | “Active” count = 0; press cards empty; QC job list empty. | Include at least one row with `status,pressing` or `assembly` and matching `press`. |
| 7" PRESS unquoted or wrong quote | Parse error or wrong value. | Use quoted field: `"7"" PRESS"`. |

---

## 7. Golden demo CSV (5 rows)

Copy the block below into a `.csv` file. Headers are lowercase; status and press use exact allowed values.

**Mix:** 2 pressing (on PRESS 1 and PRESS 2), 1 assembly, 1 queued, 1 done.

```csv
catalog,artist,album,status,press,qty,format,color,weight,due,location,notes
DEMO001,Demo Artist,First LP,pressing,PRESS 1,500,LP,Black,180g,2026-04-15,Bay A,On Press 1
DEMO002,Second Band,Another Album,pressing,PRESS 2,300,LP,Clear,140g,2026-04-20,Rack 1,On Press 2
DEMO003,Assembly Act,Third Record,assembly,,400,LP,Black,180g,2026-05-01,Bay B,In assembly
DEMO004,Queued Artist,Fourth Release,queue,,250,LP,Color,140g,2026-05-15,,Queued
DEMO005,Done Band,Fifth LP,done,,200,LP,Black,180g,2026-03-01,Bay C,Completed
```

- **DEMO001, DEMO002:** Show on PRESS 1 and PRESS 2 cards, in Active and On press filters, and in QC job list.
- **DEMO003:** In Active filter, not on a press; in QC job list.
- **DEMO004:** In Queued filter only.
- **DEMO005:** Done; excluded from open counts and normal floor filters.

Import via Admin → ↓ CSV (or your app’s CSV import). Ensure catalog values are unique if you run import more than once.
