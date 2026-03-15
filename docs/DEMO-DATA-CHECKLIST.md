# Demo data checklist

Last-mile checklist before importing and before showing Piper. Use with **docs/DEMO-CSV-SPEC.md**.

---

## 1. Pre-import checklist

- [ ] CSV has a header row (first row = column names).
- [ ] Every row has at least **catalog** or **artist** (or row is skipped).
- [ ] **status** column uses only: `queue`, `pressing`, `assembly`, `hold`, `done` (lowercase).
- [ ] **press** column (if used) is exactly: `PRESS 1`, `PRESS 2`, `PRESS 3`, or `7" PRESS` (case-sensitive).
- [ ] **press** is only set for jobs you want on a press card; leave empty for queued/assembly without a press.
- [ ] **due** dates are `YYYY-MM-DD` if present.
- [ ] No duplicate **catalog** values in the CSV (duplicates are skipped).
- [ ] At least one row has `status,pressing` or `assembly` so Active/QC have jobs.
- [ ] File saved as `.csv` (or equivalent); encoding UTF-8 if possible.

---

## 2. Import checklist

- [ ] App open; logged in or in demo mode.
- [ ] Launcher → **Admin** (main app visible).
- [ ] Go to **Floor** (or any page; import is global).
- [ ] Click **↓ CSV** (or your CSV import control).
- [ ] Select the demo CSV file.
- [ ] Toast shows “X JOBS IMPORTED” (no “IMPORT FAILED” or error toast).
- [ ] If re-importing: either clear data first or use **new catalog numbers** so rows aren’t skipped as duplicates.

---

## 3. Post-import verification checklist

- [ ] Floor stats show expected counts (e.g. Active, Queued, Total open).
- [ ] At least one job appears on a **press card** (if CSV has pressing + press).
- [ ] Clicking a job row opens the **right-side panel** with that job’s data.
- [ ] **Press logging** (Press Station purged): use LOG console and Floor; assigned job shows on Floor; log quantity via LOG.
- [ ] **QC** (launcher → QC or nav → QC Log): job list shows pressing/assembly jobs; can select and log reject.

---

## 4. Exact screens to verify after import

| Screen | What to check |
|--------|----------------|
| **Floor** | Table lists non-done jobs; catalog, artist, album, format, color, qty, status, due visible; stats (ACTIVE, QUEUED, etc.) match expectations; clicking a row opens panel. |
| **Press cards** | Each PRESS 1–4 (and 7" if used) shows “NO JOB ASSIGNED” or the job from CSV; job line shows catalog, artist, format, color, qty, due; progress bar and assets area present. |
| **Right-side panel** | Open a job from floor → panel shows same catalog, artist, album; status, press, qty, format, color, due, location, notes match CSV; SAVE works. |
| **Press logging** | (Press Station purged.) Use LOG console: select job, PRESS, numpad, LOG; or Floor for assignment. |
| **QC station** | Launcher → QC (or nav → QC Log) → “Select job” list includes pressing/assembly jobs from CSV; select one, enter qty, pick defect, log reject → toast; total and pills update. |

---

## 5. If this looks wrong, check this first

| What looks wrong | Check this first |
|------------------|------------------|
| **Press cards empty** | In CSV, **press** must be exactly `PRESS 1`, `PRESS 2`, `PRESS 3`, or `7" PRESS` (not “Press 1”, “press 1”, or “P1”). And **status** for those rows must be `pressing` (or `assembly` if you want them in QC only). |
| **QC list empty** | QC job list = jobs with **status** `pressing` or `assembly`. Confirm CSV has at least one row with `status,pressing` or `status,assembly` (lowercase). |
| **Job not in active orders** | “Active” = status `pressing` or `assembly`. “Queued” = `queue`. “Total open” = any status except `done`. Confirm **status** in CSV is one of: `queue`, `pressing`, `assembly`, `hold`, `done`. |
| **Duplicate row skipped** | Importer skips a row if **catalog** (case-insensitive) already exists. Check: no duplicate catalog in CSV; if re-importing, use new catalog numbers or clear data first. |
| **Due date looks wrong** | Use **YYYY-MM-DD** in CSV (e.g. `2026-04-15`). Other formats may parse incorrectly or show oddly. |

---

*Reference: **docs/DEMO-CSV-SPEC.md** for column list, allowed values, and golden demo CSV.*
