# Audit: presses table — `job` vs `job_id`

**Scope:** References to the column on `public.presses` that links a press to a job.  
**DB fact:** `public.presses` uses column **`job_id`** (see `supabase/schema.sql` line 58).  
**Note:** Table `qc_log` has a separate column `job` (text, job name for log entry); that is unchanged by this audit.

---

## 1. Files that correctly use `job_id` (for presses)

| File | Usage |
|------|--------|
| `supabase/schema.sql` | Line 58: `job_id text REFERENCES jobs(id) ON DELETE SET NULL` on `presses`. |
| `supabase/seed.sql` | Lines 17, 22: `INSERT INTO presses (..., job_id)` and `job_id = EXCLUDED.job_id`. |
| `supabase/rls-roles-migration.sql` | Lines 37, 47, 116: `job_on_my_press(p_job_id)`, `presses.job_id = p_job_id`, `job_on_my_press(job_id)` (progress_log policy). |
| `supabase.js` | Line 100 `pressToRow`: writes `job_id: p.job || null` (app property `p.job` → DB column `job_id`). Line 104 `rowToPress`: reads `job: row.job_id` (DB → app). Line 175: `from('presses').select('*')` (no column list; row has `job_id`). Line 227: upsert uses rows from `pressToRow`, so DB receives `job_id`. |
| `docs/ROLE-BASED-ACCESS.md` | Line 20: “Job on my press” = `presses.job_id = job.id`. |

No SQL or Supabase query assumes a column named `job` on `presses`; the table is consistently treated as having `job_id`.

---

## 2. Files that use `job` for press objects (app state / mapping)

These use the **property name `job`** for the press→job reference in **in-memory state** or the **API shape** returned to the app. The table itself is not queried with a `job` column; the mismatch is **app state and bridge** using `job` while the DB uses `job_id`.

### supabase.js

| Line | Current | Role |
|------|--------|------|
| 100 | `job_id: p.job \|\| null` | pressToRow: reads app property `job`, writes DB column `job_id` (correct for DB). |
| 104 | `job: row.job_id` | rowToPress: reads DB `job_id`, exposes to app as `job` (so app sees `job`). |

### app.js

| Line | Current | Purpose |
|------|--------|---------|
| 111–114 | `job: null` in SAMPLE_PRESSES | Initial press shape. |
| 151–154 | `job: null` in DEFAULT_PRESSES | Fallback press shape. |
| 305 | `press.job` | getStationJob(): current job for station press. |
| 1431 | `p.job` | buildPressCardHTML: job for this press. |
| 1474 | `p.job === j.id` | Press card assign dropdown selected value. |
| 1778 | Comment: `press.job references job.id` | Comment only. |
| 1805 | Comment: `press.job` canonical source | Comment only. |
| 1808 | `p.job === j.id` | syncJobPress(): which presses have this job. |
| 1818 | `p.job = jobIdVal` | setAssignment(): assign job to press. |
| 1827–1828 | `p.job === jobId`, `p.job = null` | releasePressByJob(): clear assignment. |
| 2414 | `p.job` | TV press grid: job for press. |
| 2726 | Comment: `press.job` | Comment only. |

### Other files

- **styles.css:** `.job` / `.job-id` / `job-details-*` / `job-card` etc. are **CSS class names** or **job-details UI**, not the presses table column. No change.
- **index.html / docs:** “SELECT JOB”, “job”, “assign job” are **UI copy** or **generic “job” concept**. No change unless we add a doc that describes the presses table shape (then use `job_id`).

---

## 3. Exact lines to update (if normalizing to `job_id`)

Only **press**-related property and comments; leave **qc_log.job**, **job** as in “current job” (variable names), and CSS/UI copy as-is.

### supabase.js

- **104:** `return { id: row.id, name: row.name, type: row.type, status: row.status, job_id: row.job_id };` (expose `job_id` to app instead of `job`).
- **100:** `return { id: p.id, name: p.name, type: p.type, status: p.status, job_id: p.job_id ?? p.job ?? null };` (accept both during transition) **or** `job_id: p.job_id || null` once app uses `job_id` only.

### app.js

- **111–114:** `job_id: null` in SAMPLE_PRESSES.
- **151–154:** `job_id: null` in DEFAULT_PRESSES.
- **305:** `press.job_id` (and keep fallback `press.job` for old snapshots if desired).
- **1431:** `p.job_id` (and optional `p.job` fallback).
- **1474:** `p.job_id === j.id`.
- **1778:** Comment: “press.job_id references job.id”.
- **1805:** Comment: “press.job_id” canonical source.
- **1808:** `p.job_id === j.id`.
- **1818:** `p.job_id = jobIdVal`.
- **1827–1828:** `p.job_id === jobId`, `p.job_id = null`.
- **2414:** `p.job_id`.
- **2726:** Comment: “press.job_id”.

**Not changed:** Lines 1710, 2392 use `e.job` where `e` is a **qc_log entry** (qc_log.job is the job name text). Leave those as-is.

---

## 4. Proposed smallest patch (normalize to `job_id`)

Safe to do in one pass: DB and RLS already use `job_id`; only app state and the Supabase bridge use `job`. Patch only the press→job reference.

### 4.1 supabase.js

- **rowToPress:** Return `job_id: row.job_id` (or keep `job: row.job_id` for backward compatibility with existing in-memory state; then app can be updated and later remove `job`). For full normalization: return `job_id: row.job_id`.
- **pressToRow:** Use `job_id: p.job_id ?? p.job ?? null` so both shapes work during/after transition; then once app is updated, use `job_id: p.job_id || null`.

### 4.2 app.js

- Replace every **press object** use of `.job` with `.job_id` for the “assigned job id” meaning (see section 3). Include SAMPLE_PRESSES, DEFAULT_PRESSES, getStationJob, buildPressCardHTML, setAssignment, releasePressByJob, syncJobPress, TV press grid, and the three comments.
- Optional: when reading from localStorage or offline snapshot, support both `job` and `job_id` for one release (e.g. `p.job_id ?? p.job`) so old saved state still works.

### 4.3 Docs / QA

- **ROLE-BASED-ACCESS.md:** Already says `presses.job_id`; no change.
- **SUPABASE-RUNBOOK.md / STATE-SNAPSHOT.md:** No change unless they describe press object shape; then use “press.job_id” in that description.
- Any QA or runbook query that selects from `presses` should use `job_id` (already correct in SQL files).

### 4.4 What not to change

- **qc_log:** Table and code for `qc_log` use column `job` (text); do not rename to job_id for qc_log.
- **progress_log:** Uses `job_id`; no change.
- **jobs table:** No “job” column on jobs; no change.
- **CSS / HTML:** Class names and labels (“job”, “SELECT JOB”) stay as-is.

---

## 5. Summary

| Area | Status |
|------|--------|
| **SQL / Supabase (presses table)** | Correct: schema, seed, RLS, and supabase.js all use `job_id` for the DB. |
| **App state (S.presses)** | Uses property `job`; normalizing to `job_id` requires the app.js + supabase.js changes above. |
| **Docs** | ROLE-BASED-ACCESS already uses `presses.job_id`; no other doc assumes a `job` column on presses. |

No refactor was applied; this document is the audit and the proposed patch list only.
