# Root-cause audit: Panel edit persistence

**Project:** PMP OPS  
**Bug:** Data entered from the right-side slide panel does not reliably persist.  
**Scope:** Trace full persistence path; identify where persistence breaks or becomes inconsistent. No implementation in this doc.

---

## 1. Observed flow

### Panel open (existing job)

1. **openPanel(id)** (app.js)  
   - Sets `S.editId = id`, `panelOpen = true`, `curAssets = {}`.  
   - Resolves `j = S.jobs.find(x => x.id === S.editId)`. If `!j`, returns early (panel left open, form not filled).  
   - Fills form: `FIELD_MAP.forEach(f => { if (el && j[f.key] != null) el.value = j[f.key]; })`.  
   - **Only sets inputs when `j[f.key] != null`.** If a field is `null` or `undefined`, that input is **not** updated and keeps its previous value (from last opened job or initial DOM).  
   - Sets `jPress` for comma-separated press; sets `jOv` from qty; sets `curAssets` from `j.assets`.  
   - buildAssetList(), renderProgressSection(), status suggestion, notes section.  
   - For existing job, setPanelEditMode(false) so form is read-only until user clicks EDIT.

### Panel save

2. **saveJob()** (app.js)  
   - Uses **S.editId** to decide existing vs new. No other check.  
   - Builds **job** from form: `job = { id: S.editId || 'j'+Date.now() }` then `FIELD_MAP.forEach` → `job[f.key] = el.value` (with trim/upper where applicable). So **only FIELD_MAP keys** are read from the form.  
   - `job.assets = curAssets`.  
   - For **existing**: copies `progressLog`, `notes`, `assembly`, `notesLog`, `assemblyLog` from `existing = S.jobs.find(j => j.id === S.editId)`, then `S.jobs[i] = job` (same index).  
   - Press: if `job.press` set → setAssignment; else releasePressByJob.  
   - **await Promise.all([Storage.savePresses(S.presses), Storage.saveJob(job)])** then closePanel(), renderAll(), toast.

### Storage

3. **Storage.saveJob(job)** (storage.js)  
   - **Supabase:** sets pendingWrites, then `supabaseWithRetry(() => PMP.Supabase.saveJob(job))`. On success: lastLocalWriteAt, setSyncState('synced'). On catch: toast 'SAVE FAILED' but **promise still resolves** (no rethrow).  
   - **Local:** pendingWrites.delete, **scheduleSave()** (800ms debounce), returns Promise.resolve() immediately. No synchronous write.

4. **Supabase.saveJob(job)** (supabase.js)  
   - **jobToRow(job)** builds row; **qty** sent as `Number.isInteger(qty) ? qty : null` (parseInt(job.qty,10)). So empty string → NaN → null.  
   - **client.from('jobs').upsert(row, { onConflict: 'id' })**. Full row overwrite.

5. **loadAll()** (app.js)  
   - **Supabase:** `data = await Storage.loadAllData()` (fetches jobs, progress_log, presses, etc.).  
   - If `data.jobs && data.jobs.length > 0` → **S.jobs = data.jobs** (full replace). No merge.  
   - Conflict check only toasts and deletes pendingWrites; it does **not** skip overwrite.  
   - Poll: every 5s, **if (!panelOpen && !saveInFlight)** then loadAll().  
   - Realtime: debounced 300ms; if not self-echo (lastLocalWriteAt &lt; 1s) and panel open → showDataChangedNotice; else loadAll().

### Floor card vs panel

6. **saveFloorCardQuickEdit()** (render.js)  
   - Mutates **j** (in-memory job) with status, press, location, due, notes, assembly from fc* inputs.  
   - Calls **Storage.saveJob(j)** (same job reference, full object). So floor card writes a subset of fields by mutation then saves the whole job. Same storage path as panel.

---

## 2. Likely breakpoints

| # | Location | What happens | Effect |
|---|----------|--------------|--------|
| A | app.js openPanel | Form init: `if (el && j[f.key] != null) el.value = j[f.key]` | Fields with `null`/`undefined` are not set; inputs keep previous job’s values. Save then persists wrong value for current job. |
| B | app.js loadAll | Unconditional `S.jobs = data.jobs` when data.jobs.length > 0 | Any loadAll after save replaces in-memory state with server/local data. If that data is stale, panel “saved” state is lost. |
| C | storage.js saveJob (local) | scheduleSave() only; no await of actual write; returns immediately | Persist happens 800ms later. Any loadAll before that reads stale localStorage and overwrites S.jobs. |
| D | storage.js saveJob (Supabase) | .catch() toasts but does not rethrow | saveJob() promise still resolves; app.js always closes panel and shows “JOB UPDATED” even when save failed. |
| E | app.js saveJob | closePanel() after await | Poll is gated by panelOpen; Realtime can still fire after close. With await-before-close, Supabase path is usually safe; local path is not (no real await of write). |

---

## 3. Ranked root causes

### 1. **Panel form init leaves inputs unchanged when job field is null/undefined**  
**Confidence: High**

- **File:** app.js  
- **Function:** openPanel()  
- **Code:** `FIELD_MAP.forEach(f => { if (el && j[f.key] != null) el.value = j[f.key]; })`  
- **Why it causes non-persistence / wrong persistence:**  
  If the user opens job A (e.g. qty 500), then opens job B which has `qty: undefined` or missing, the qty input is **not** updated and still shows 500. On save, we read 500 from the form and write it to job B. So either another job’s value is persisted for B, or the user edits 500→600 and we persist 600 for B while the UI suggested 500 was “current”. Same for any FIELD_MAP field that is null/undefined (catalog, due, press, etc.).  
- **Category:** (b) In-memory state mutation is correct, but **UI state** (form) is wrong, so the **write path** persists incorrect values.

### 2. **loadAll() unconditionally replaces S.jobs; race with save in local mode**  
**Confidence: High**

- **File:** app.js (loadAll), storage.js (scheduleSave)  
- **Functions:** loadAll() (S.jobs = data.jobs), Storage.saveJob() in local mode (scheduleSave only)  
- **Why:**  
  In **local mode**, saveJob() does not perform a synchronous write. It calls scheduleSave() (800ms debounce) and returns a resolved promise. saveJob() in app.js awaits that promise, then closePanel() and renderAll(). So panel closes immediately. Any loadAll() that runs before the 800ms timer fires (e.g. next poll tick, or a loadAll triggered by navigation/other logic) reads **stale** localStorage and does **S.jobs = data.jobs**, overwriting the just-updated in-memory job.  
- **Category:** (d) Post-save reload overwrite with stale DB (local) or (e) race between write and read.

### 3. **Supabase save failure still closes panel and shows success**  
**Confidence: High**

- **File:** storage.js  
- **Function:** Storage.saveJob()  
- **Code:** .catch() sets toast 'SAVE FAILED' but does not rethrow; promise resolves.  
- **Why:**  
  app.js does `await Storage.saveJob(job)` then closePanel() and toast('JOB UPDATED'). If Supabase save fails, the user sees the panel close and “JOB UPDATED” while the backend never persisted. So “non-persistence” here is real (server has no update); the UI suggests otherwise.  
- **Category:** (c) Save bridge / Supabase path (failure not propagated) and (a) UI state (misleading success).

### 4. **Realtime or poll can run loadAll() with stale server data in narrow window**  
**Confidence: Medium**

- **File:** app.js  
- **Functions:** startRealtime callback, startPollInterval  
- **Why:**  
  After await of save, we closePanel(). Then panelOpen is false. Realtime has a 1s self-echo guard; poll has saveInFlight only during the actual Supabase request. So after save completes, a Realtime event (e.g. delayed or from another table) or the next poll can run loadAll(). If the server is eventually consistent or the read replica is behind, loadAll() could occasionally get an older version of the job and overwrite S.jobs. Less likely than (1) and (2) but possible.  
- **Category:** (d) Post-save reload overwrite with stale DB.

### 5. **Notes/assembly in panel not in FIELD_MAP; always taken from existing on save**  
**Confidence: Low for “number of records” bug; relevant for notes/assembly**

- **File:** app.js saveJob()  
- **Code:** `job.notes = existing?.notes != null ? existing.notes : job.notes` (and same for assembly).  
- **Why:**  
  Notes/assembly in the full panel are edited via jNotesInput/jAssemblyInput which append to notesLog/assemblyLog and set job.notes/assembly in place when user “adds” a note. They are not in FIELD_MAP, so the main “current notes” text is not read from a single field on save; we intentionally keep existing. So for notes/assembly, persistence is consistent with that design. For qty/catalog/etc., this is not the cause; for “edit note only” it can confuse if the user expects a single editable notes field.  
- **Category:** Data shape / write path design; only a root cause for notes/assembly UX, not for qty reverting.

---

## 4. Single source of truth diagnosis

- **Canonical in memory:**  
  **S.jobs** is the single source of truth. The panel form is a **view** of the job at open time. Save should write **from the form** (user intent) into the in-memory job and then persist that job.

- **Canonical write path:**  
  **saveJob()** in app.js: build job from form (FIELD_MAP + curAssets + existing progressLog/notes/assembly/notesLog/assemblyLog), replace S.jobs[i], then **Storage.saveJob(job)**. For Supabase that should be the only full-job upsert for the panel. Floor card mutates the same S.jobs reference and calls the same Storage.saveJob(j).

- **Canonical reload path:**  
  **loadAll()**: replace S.jobs (and presses, etc.) with **Storage.loadAllData()**. So the only source after reload is whatever loadAllData() returns (Supabase or localStorage). If that data is stale at the time of the read, it becomes the new “truth” and overwrites the just-saved state.

- **Where consistency breaks:**  
  1) Form is not initialized to a full snapshot of the job (null/undefined not normalized), so the “user intent” we read on save can be wrong.  
  2) Local mode: persist is deferred 800ms; loadAll() can run before persist and overwrite S.jobs with old data.  
  3) Save failure is not surfaced; panel closes and success is shown even when the write path failed.

---

## 5. Smallest real fix (no refactor, no band-aids)

1. **Panel init (app.js openPanel)**  
   For existing job, set every FIELD_MAP field from the job with a defined fallback when value is null/undefined (e.g. `el.value = (j[f.key] != null && j[f.key] !== '') ? j[f.key] : ''` for text/select; handle date/select appropriately). So the form always reflects the current job, and no input retains a previous job’s value.

2. **Local mode: ensure persist before “save complete”**  
   In **storage.js**, when `!useSupabase()` and saveJob is called: either  
   - perform an immediate write (e.g. safeSet(STORE_KEY, { jobs: S.jobs, ... }) and await it) before returning, or  
   - expose a way to “flush” scheduleSave (e.g. clear the timer and run the save callback once, return that promise) and have app.js await that flush so loadAll() cannot run with stale data before the write has happened.

3. **Propagate save failure to app.js**  
   In **storage.js** saveJob (Supabase path), in .catch() rethrow (or reject the promise) so that app.js’s await Storage.saveJob(job) rejects. In app.js, in saveJob(), wrap in try/catch: on failure, do **not** closePanel(), do not toast success; toast error and leave panel open so the user can retry or copy data.

4. **Optional (if still seeing reverts on Supabase)**  
   After a successful panel save, avoid running loadAll() for a short window (e.g. 1–2s) for that job id, or merge the just-saved job into data.jobs in loadAll when we have a very recent pendingWrite for that id, instead of always doing a full replace. This is a smaller, targeted guard rather than a broad architectural change.

---

## 6. Band-aids / masking logic (current code)

| Band-aid | Location | What it does | Why it masks |
|----------|----------|--------------|--------------|
| Await save before closePanel | app.js saveJob() | await Promise.all([savePresses, saveJob]) then closePanel() | Reduces race where poll runs loadAll() while panel is still open. Does **not** fix local mode (no real persist before return) or form-init bugs. |
| 1s self-echo guard | app.js startRealtime | Skip loadAll if Date.now() - lastLocalWriteAt < 1000 | Avoids one Realtime event overwriting immediately after our write. Does not fix stale read from replica or delayed event. |
| 2.5s “panel just opened” guard | app.js startRealtime | If panelOpen and panelOpenedAt &lt; 2.5s, skip showDataChangedNotice | Reduces “data updated elsewhere” right after opening. Does not fix persistence. |
| Conflict window toast only | app.js loadAll | On hash mismatch with pendingWrites, toast and delete pending; still do S.jobs = data.jobs | Informs user of conflict but still overwrites; does not preserve local edits or retry. |
| saveInFlight skips poll | app.js startPollInterval | if (saveInFlight) return | Prevents loadAll during the Supabase request. Does not help after request completes and before user expects data to be “saved” in local mode. |

---

## 7. Failure-mode summary (by scenario)

| Scenario | Expected | Likely cause if it fails |
|----------|----------|---------------------------|
| Edit existing job in panel, save, reload page | Persisted job from server/local. | (2) local mode: loadAll before 800ms write; (3) Supabase save failed but panel closed. |
| Edit existing job, close panel, reopen | Reopen reads from S.jobs; if loadAll ran with stale data, S.jobs is reverted. | (2) or (4). |
| Edit note only (add note in panel) | notes/assembly updated in job and saved. | Notes are taken from existing in saveJob; new note is applied in add-note handler and mutates job — then saveJob overwrites with same existing.notes if we didn’t re-read. Actually add note pushes to notesLog and sets job.notes = text; then we’d need to save. saveJob takes job.notes from existing — and existing is the same j we mutated, so notes should be updated. So note-only edit should persist unless (2)/(3). |
| Edit assembly/location only | Same as note; location is in FIELD_MAP so should be in job. | (1) if location was null and form had old value; (2)/(3) otherwise. |
| Edit press assignment only | job.press from form; setAssignment/release; save job and presses. | (1) if press was undefined and form showed old press; (2)/(3). |
| Edit assets only | curAssets; job.assets = curAssets in saveJob. | (2)/(3); or if user doesn’t click Save after assets, no save. |
| Edit multiple fields at once | All FIELD_MAP fields + assets + preserved progressLog/notes/assembly. | (1) for any null/undefined field showing stale value; (2) local; (3) on failure. |
| Create new job, then reopen | New job in S.jobs and persisted; reopen finds it by id. | (2) local: new job not in localStorage yet when loadAll runs; (3) save failed. |
| Save while Realtime active | Our save wins; 1s guard avoids immediate overwrite. | (4) if Realtime delivers stale payload after 1s. |
| Save in local vs Supabase | Local: scheduleSave 800ms; Supabase: immediate upsert. | Local: (2). Supabase: (3) or (4). |

---

**Conclusion:** The most likely root causes are **(1) form init not normalizing null/undefined**, **(2) local mode persist deferred so loadAll can overwrite**, and **(3) save failure not propagated so panel closes and shows success**. Fixing (1), (2), and (3) as in §5 gives the smallest real fix without refactors or extra band-aids.
