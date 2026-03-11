# Archive Flow Audit — Root Cause Analysis

**Audit-only. No code changes. Goal: identify exact root cause(s) before patching.**

---

## PHASE 1 — Archive flow end-to-end

### 1. Frontend / archive entry points

| Entry point | File | Trigger |
|-------------|------|---------|
| **Archive button** | `index.html` L678 | `<button id="archiveBtn" onclick="archiveJob()"` |
| No other UI calls `archiveJob` | — | Only this button. |
| No RPC used for archive | — | Archive is implemented as a normal job save with archive fields set. |

There are **no** other archive entry points (no separate updateJob, no RPC). The only archive action is: user clicks ARCHIVE → `archiveJob()`.

### 2. Exact function chain (UI → Supabase write)

```
User clicks "ARCHIVE"
  → archiveJob()                    [app.js L1214]
  → mutates S.jobs[i]: j.archived_at, j.archived_by, j.archive_reason = ''  [L1219–1221]
  → releasePressByJob(j.id)         [stations.js]
  → await Storage.saveJob(j)        [app.js L1224]
       → storage.js saveJob(job)    [storage.js L212]
       → supabaseWithRetry(() => window.PMP.Supabase.saveJob(job))  [L224]
            → supabase.js saveJob(job)  [supabase.js L224]
            → jobToRow(job)             [supabase.js L16–52]
            → client.from('jobs').upsert(row, { onConflict: 'id' })   [L227]
  → on success: await Storage.savePresses(S.presses) [app.js L1225]
  → closePanel(); renderAll(); toast('Job archived')
  → on failure: catch → setSyncState('error'), toastError(e?.message || ...)
```

No other path writes archive fields (e.g. no dedicated “archive” RPC). Archive = one full job upsert with archive fields set.

### 3. Exact payload sent to Supabase when archiving

`jobToRow(job)` (supabase.js L16–52) builds the row. When archiving, the job object has just been mutated to:

- `job.archived_at` = ISO timestamp string  
- `job.archived_by` = string (email or display name)  
- `job.archive_reason` = `''`

So the payload includes every column in `jobToRow`, including:

- **archived_at** — sent (ISO string or null)  
- **archived_by** — sent (string or null)  
- **archive_reason** — sent (empty string `''` or null)

All three are **always** present in the object passed to `client.from('jobs').upsert(row, { onConflict: 'id' })`.

### 4. Summary: what the frontend sends

- **archived_at**: yes (from `job.archived_at || null`)  
- **archived_by**: yes (from `job.archived_by || null`)  
- **archive_reason**: yes (from `job.archive_reason || null`)  
- No other archive-specific fields. No RPC; single upsert to `jobs`.

---

## PHASE 2 — Supabase expectations vs actual usage

### 5. Every place that assumes archive fields exist

| Location | Assumption |
|----------|------------|
| **core.js** L271 | `isJobArchived(job)` uses `!!(job && job.archived_at)` — assumes `archived_at` on job object. |
| **supabase.js** L49–51 | `jobToRow`: writes `archived_at`, `archived_by`, `archive_reason` to row. |
| **supabase.js** L89–93 | `rowToJob`: reads `row.archived_at`, `row.archived_by`, `row.archive_reason` (defaults to null if missing). |
| **app.js** L1022 | Panel: show Archive button only when `j && !j.archived_at`. |
| **app.js** L1217 | Guard: `if (j.archived_at) { toast('Job is already archived'); return; }`. |
| **app.js** L1173–1175 | saveJob (edit path): copies `existing.archived_at`, `existing.archived_by`, `existing.archive_reason` onto job. |
| **app.js** L1219–1221 | archiveJob: sets `j.archived_at`, `j.archived_by`, `j.archive_reason = ''`. |
| **render.js** | All active views filter with `!isJobArchived(j)` (multiple call sites). |

`rowToJob` does not require DB columns to exist: if the row from `select('*')` has no `archive_reason`, `row.archive_reason` is undefined and `row.archive_reason || null` is null. So **SELECT/load** does not assume columns exist. **INSERT/UPDATE (upsert)** does: the payload always includes those keys, so Postgres must have the columns or the upsert fails.

### 6. Tables / views / upserts / selects / RPCs

- **Table**: `public.jobs` only. No archive-specific view.  
- **Writes**: `client.from('jobs').upsert(row, { onConflict: 'id' })` only (supabase.js L227).  
- **Reads**: `client.from('jobs').select('*')` in `loadAllData()` (L186).  
- **RPCs**: none for archive.  
- **updateJobAssets**: only updates `assets` column; does not touch archive columns.

### 7. How archive is implemented

- **Direct jobs table update via upsert.** One full-row upsert including archive fields.  
- No RPC, no trigger that writes archive (audit trigger only logs after successful write).  
- No view involved.

### 8. Where `archive_reason` is expected

- **INSERT/UPDATE**: Yes — `jobToRow` always puts `archive_reason` in the row object; upsert sends it. If the column is missing in DB, Postgres errors.  
- **SELECT**: Row shape is whatever `select('*')` returns. If column is missing, `row.archive_reason` is undefined; `rowToJob` treats it as null. So SELECT does not require the column.  
- **Client-side model**: All code that reads a job assumes the object may have `archived_at`, `archived_by`, `archive_reason` (and uses `|| null` or `isJobArchived`). No crash if missing; only the upsert fails when the DB lacks the column.

---

## PHASE 3 — Migration / schema audit

### 9. Archive-related SQL / migration files

| File | Purpose | Archive columns? |
|------|---------|------------------|
| **supabase/schema.sql** | Base schema; `CREATE TABLE IF NOT EXISTS jobs (...)` | Yes — L38–40: `archived_at`, `archived_by`, `archive_reason` in the CREATE. |
| **supabase/archive-columns-migration.sql** | Add columns to existing table | Yes — `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS` for all three. |
| **supabase/seed.sql** | Seed data | No — INSERT into jobs does not list archive columns (they get DEFAULT NULL). |
| **supabase/audit-log-migration.sql** | Trigger on jobs | No — trigger uses generic `to_jsonb(NEW)`; does not reference column names. |
| Other SQL (policies, RLS, realtime, etc.) | No changes to jobs column set | N/A |

So in the repo: **schema.sql** and **archive-columns-migration.sql** both define the three archive columns.

### 10. Critical findings

- **Was `archive_reason` (and siblings) ever added to the live DB?**  
  - **schema.sql**: `CREATE TABLE IF NOT EXISTS jobs` — only adds columns when the table is **first created**. If the project was created from an older schema (without archive columns), the table already existed; re-running schema.sql does **not** add new columns.  
  - **archive-columns-migration.sql**: This is the only script that **adds** columns to an existing `jobs` table (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). It must be run **manually** in the Supabase SQL Editor for existing projects. There is no automated migration runner in the repo.

- **Correct table**: All archive usage is on `public.jobs`. No other table.

- **Missing / unapplied / partial**:  
  - If the live Supabase project was created before archive support, the live `jobs` table does **not** have `archived_at`, `archived_by`, `archive_reason` unless someone ran **archive-columns-migration.sql** in that project.  
  - **Conclusion**: The most likely state is **migration not applied** on the live DB the app is using.

### 11. Mismatches

| Aspect | Local SQL / frontend | Live DB (if migration not run) |
|--------|----------------------|--------------------------------|
| schema.sql | CREATE includes archive columns | N/A (table already exists, CREATE not re-run). |
| archive-columns-migration.sql | Defines ALTER to add columns | Must be run manually; if not run, columns missing. |
| Frontend jobToRow | Always sends archived_at, archived_by, archive_reason | Upsert fails: “column … does not exist” (or “could not find archive_reason”). |
| Frontend rowToJob | Reads row.archive_* || null | SELECT succeeds; missing columns become undefined → null. |

So the only **write** path assumes the three columns exist; the **read** path is tolerant of missing columns.

---

## PHASE 4 — How the three errors happen together

### 12. “could not find the archive_reason” and “already archived”

- **“could not find the archive_reason”** (or similar, e.g. “column \"archive_reason\" of relation \"jobs\" does not exist”):  
  - Comes from **Postgres/Supabase** when the app sends an upsert payload that includes a key `archive_reason` (and/or `archived_at`, `archived_by`) and the **live `jobs` table does not have those columns**.  
  - So: **live schema mismatch** — migration not applied (or wrong project).

- **“already archived”**:  
  - Comes from **app.js** L1217: `if (j.archived_at) { toast('Job is already archived'); return; }`.  
  - So: the **in-memory** job already has `archived_at` set when the user tries to archive again.

- **“sync error during archive”**:  
  - Either: (1) **archiveJob** catch block: `setSyncState('error', { toast: 'ARCHIVE FAILED' })` and `toastError(e?.message || …)` — user sees sync status “ERR” and the error message; or (2) if any promise in the chain rejected without being caught (e.g. old build or another path), **unhandledrejection** in app.js L6–9: `toastError('Sync error. Will retry.')`.

### 13. Order of operations that produces both

1. User clicks ARCHIVE.  
2. **archiveJob()** runs:  
   - Guard: `j.archived_at` is falsy → OK.  
   - **Then** it sets `j.archived_at`, `j.archived_by`, `j.archive_reason = ''` **immediately** (L1219–1221), **before** any await.  
   - So the in-memory job is **already marked archived** before the network call.  
3. `await Storage.saveJob(j)` runs → Supabase upsert sends row including `archive_reason` (and siblings).  
4. **DB lacks columns** → Postgres throws → Storage.saveJob rejects → archiveJob catch runs → user sees “ARCHIVE FAILED” and “could not find…” (or similar).  
5. **Panel is not closed** (we only close on success). So the user still has the same job open.  
6. **In-memory state**: `S.jobs[i]` still has `archived_at` (and archived_by, archive_reason) set from step 2. We **never revert** them on failure.  
7. User clicks ARCHIVE again.  
8. Guard: `if (j.archived_at)` is now true → toast “Job is already archived” and return.  

So: **First click** → schema error from DB. **Second click** → “already archived” from stale local state (we set archive fields before the write and don’t roll back on failure).

### 14. Is the archive partially succeeding?

- **No.** If the upsert fails (missing column), the transaction fails; no row is updated. The DB never gets the archive state.  
- Only **in-memory** state is updated (and not reverted), so the app “thinks” the job is archived while the DB does not.

---

## PHASE 5 — Smallest reproducible path and bug classification

### 15. Smallest reproducible path

1. Use a Supabase project whose `jobs` table **does not** have `archived_at`, `archived_by`, `archive_reason`.  
2. Open a job in the panel.  
3. Click ARCHIVE once → DB error (“could not find archive_reason” or “column … does not exist”).  
4. Click ARCHIVE again → “Job is already archived.”

### 16. Bug classification

| Bug | Primary? | Description |
|-----|----------|-------------|
| **Schema / migration** | **Yes** | Live DB missing archive columns; migration not applied (or wrong project). |
| **Frontend payload** | No | Payload is correct; it expects the columns to exist. |
| **Stale local state** | **Yes** | archiveJob sets `j.archived_at` (and siblings) **before** the try/await and **never reverts** on failure, so a failed archive still marks the job archived in memory and causes “already archived” on retry. |
| **Retry logic** | No | supabaseWithRetry retries the same upsert; same error. Not the cause of “already archived.” |

So: **two** root causes — (1) **live schema**: migration not applied; (2) **frontend**: mutating archive state before write and not rolling back on failure.

---

## OUTPUT SUMMARY

### 1. Exact root cause(s)

1. **Live Supabase `jobs` table does not have `archived_at`, `archived_by`, `archive_reason`** — either the project was created from an older schema or **archive-columns-migration.sql** was never run in the project the app uses. The upsert then fails with a column-not-found type error (“could not find archive_reason” or equivalent).  
2. **archiveJob() sets `j.archived_at` (and archived_by, archive_reason) before awaiting the save and does not revert them on failure.** So after a failed archive, the job is “archived” in memory; a second click hits the guard and shows “Job is already archived.”

### 2. Exact files / functions involved

- **index.html** L678: Archive button → `archiveJob()`.  
- **app.js** L1214–1233: `archiveJob()` — sets archive fields (L1219–1221), then `await Storage.saveJob(j)` (L1224), catch (L1229–1232).  
- **storage.js** L212–244: `saveJob(job)` → `supabaseWithRetry(… Supabase.saveJob(job))`.  
- **supabase.js** L16–52: `jobToRow(job)` (builds row with archive fields).  
- **supabase.js** L224–228: `saveJob(job)` → `client.from('jobs').upsert(row, { onConflict: 'id' })`.  
- **supabase/schema.sql** L38–40: archive columns in CREATE (new installs only).  
- **supabase/archive-columns-migration.sql**: ALTER TABLE to add archive columns (must be run for existing DBs).

### 3. Exact schema / migration issue

- **schema.sql** only adds columns when the table is first created (`CREATE TABLE IF NOT EXISTS`). It does not add columns to an existing table.  
- **archive-columns-migration.sql** is the only way to add these columns to an existing `jobs` table. It is not run automatically; it must be executed manually in the Supabase SQL Editor for the project the app uses.  
- If that has not been done, the live table has no `archived_at`, `archived_by`, `archive_reason` → upsert fails.

### 4. Does archive partially succeed?

- **No.** The upsert fails entirely; no row is updated. Only in-memory state is wrong (archive fields set and not reverted).

### 5. Smallest safe fix (to be applied after audit)

- **Schema**: Run **archive-columns-migration.sql** in the Supabase SQL Editor for the project the app points to (see section 7 below).  
- **Frontend**: In **archiveJob()**, either: (a) set `j.archived_at` / `j.archived_by` / `j.archive_reason` **inside** the try block **after** a successful save, or (b) set them before the save but in the catch block **revert** them (e.g. `j.archived_at = null; j.archived_by = null; j.archive_reason = null`) so a failed archive does not leave the job “archived” in memory.

### 6. Does Supabase SQL need to be run manually?

- **Yes.** For any existing project where the `jobs` table was created without archive columns, the archive migration must be run manually in the Supabase Dashboard → SQL Editor. There is no in-repo migration runner.

### 7. SQL to verify the live schema

Run in Supabase SQL Editor (same project as `SUPABASE_URL` / anon key):

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;
```

- If `archived_at`, `archived_by`, `archive_reason` are **missing** from the result, run **supabase/archive-columns-migration.sql** (the three `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS …` statements and optional COMMENTs).

---

**End of audit. No code has been changed.**
