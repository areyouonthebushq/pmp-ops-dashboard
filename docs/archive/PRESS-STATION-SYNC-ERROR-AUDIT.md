> **Archived.** Press Station shell purged. See [`purgatory-protocol.md`](../purgatory-protocol.md). Retained as historical reference.

# Press Station sync error — root-cause audit

Audit-only. No code or SQL changed. Purpose: identify the exact failing operation so a fix can be applied.

---

## 1. Press-station write paths (UI → app → storage → Supabase)

Every action from Press Station that can produce a sync error, with full call chain:

| Action | UI | App function | Storage | Supabase call |
|--------|----|--------------|---------|----------------|
| **Log pressed qty** | LOG PRESSED button → `psNumpadSubmit()` | `pressStationLogPressed(qty)` → `logJobProgress(job.id, 'pressed', qty, 'Press Station')` | `Storage.logProgress({ job_id, qty, stage: 'pressed', person, timestamp })` | `client.from('progress_log').insert(row)` |
| (same click, conditional) | — | Inside `logJobProgress`: if `suggestedStatus` suggests `pressing` or `done`, then `job.status = suggestion.suggested`; `Storage.saveJob(job)` | `Storage.saveJob(job)` | `client.from('jobs').upsert(row, { onConflict: 'id' })` |
| **Hold job** | HOLD JOB button | `pressStationHold()` → `job.status = 'hold'`; `Storage.saveJob(job)` | `Storage.saveJob(job)` | `client.from('jobs').upsert(row, { onConflict: 'id' })` |
| **Resume job** | RESUME JOB button | `pressStationResume()` → `job.status = 'pressing'`; `Storage.saveJob(job)` | `Storage.saveJob(job)` | `client.from('jobs').upsert(row, { onConflict: 'id' })` |
| **Save note** | SAVE NOTE button | `pressStationSaveNote()` → `job.notes = el.value`; `Storage.saveJob(job)` | `Storage.saveJob(job)` | `client.from('jobs').upsert(row, { onConflict: 'id' })` |

**Press assignment/update from Press Station:** None. `assignJob()` and `setPressStatus()` (which call `Storage.savePresses`) are only used from the admin/floor press card controls (`buildPressCardHTML(..., isAdmin)`). A press-role user in Press Station never triggers `savePresses`.

---

## 2. Exact Supabase operation that fails

- **Most likely:** `progress_log` **INSERT** from **Log pressed**.
  - Chain: `pressStationLogPressed` → `logJobProgress` → `Storage.logProgress` → `window.PMP.Supabase.logProgress(entry)` → `client.from('progress_log').insert(row)` (supabase.js line 266).
- **Alternatively:** `jobs` **UPDATE** (implemented as upsert) from:
  - same `logJobProgress` path when status suggestion changes (app.js ~229–232), or
  - Hold / Resume / Save note: `Storage.saveJob(job)` → `client.from('jobs').upsert(row, { onConflict: 'id' })` (supabase.js line 221).

- **Not from Press Station for press user:** `presses` update, `qc_log` insert, `loadAll`/read, or realtime callback. Realtime only triggers `loadAll()`; press SELECT policies allow all rows, so that path does not set sync error. `loadAllData()` does call `savePresses` when presses are empty but uses `.catch(() => {})`, so it does not surface a sync error.

---

## 3. Current policy mismatch audit (SQL in repo)

**Files:** `supabase/rls-roles-migration.sql`, `supabase/press-choose-any-policy.sql`.

**If only rls-roles-migration.sql is applied (press-choose-any-policy.sql not run):**

| Table | Policy name | Effect |
|-------|-------------|--------|
| progress_log | `progress_log_press_insert` | INSERT allowed only when `get_my_role() = 'press'` AND `stage IN ('pressed','qc_passed')` AND **job_on_my_press(job_id)**. |
| jobs | `jobs_press_update_own` | UPDATE only when `get_my_role() = 'press'` AND **job_on_my_press(id)**. |
| presses | `presses_press_update_own` | UPDATE only when **id = get_my_press_id()**. |

`get_my_press_id()` = `profiles.assigned_press_id` for current user with `role = 'press'`.  
`job_on_my_press(job_id)` = job is on that single press. So if the user chose a different press in the launcher (e.g. Press 2) and the job is on Press 2, but `assigned_press_id` is e.g. `p1`, then `job_on_my_press(job_id)` is false → **INSERT/UPDATE denied**.

**If press-choose-any-policy.sql is also applied:**

Same three policy names are **dropped and recreated** to use:
- `progress_log_press_insert`: `job_on_any_press(job_id)` instead of `job_on_my_press(job_id)`.
- `jobs_press_update_own`: `job_on_any_press(id)` instead of `job_on_my_press(id)`.
- `presses_press_update_own`: `id IN ('p1','p2','p3','p4')` instead of `id = get_my_press_id()`.

No other policy names are changed. So:

- **If the patch was not run (or only partially run):** The old single-press policies remain. Then `progress_log` INSERT and/or `jobs` UPDATE for a job on the chosen (non-assigned) press will be denied by RLS.
- **If the patch was run:** Those three policies are the only ones active for press writes; no old single-press policy remains for them. Then the remaining sync error would have to come from something else (e.g. `get_my_role()` not `'press'`, or a different failure).

---

## 4. App/frontend mismatch audit (assigned_press_id / single press)

| Location | Behavior for press-role |
|----------|--------------------------|
| **getAuthAssignedPressId()** (stations.js) | Returns `window.PMP.userProfile.assigned_press_id`. Used only in **enterByLauncher** when `role === 'press'` and `choice !== 'press'` to compute `effectivePressId`. When user chooses Press from launcher, `effectivePressId = pressId` (chosen press), not profile. So launcher choice overrides profile for which press is used. |
| **mayEnterStation(choice, pressId)** (stations.js) | For `role === 'press'`, returns `choice === 'press' && !!pressId`. The `pressId` is the launcher-chosen press. No comparison to assigned_press_id. |
| **getStationEditPermissions()** (stations.js) | For press, `canLogPressProgress = !!inPressStation` (stationType === 'press'). No use of assigned_press_id. |
| **getStationPress()** (stations.js) | Uses `S.assignedPressId` (set by `openPressStation(pressId)` from launcher choice). Not profile.assigned_press_id. |
| **getStationJob()** (stations.js) | Uses `getStationPress()` → job on chosen press. No profile comparison. |
| **openPressStation(pressId)** (stations.js) | Called with launcher-chosen `effectivePressId`; `setStationContext({ assignedPressId: pressId })`. Correct. |
| **exitPressStation()** (stations.js) | Uses `getAuthRole()` and `S.mode` only; no assigned_press_id. |

**Conclusion:** The frontend does **not** assume a single assigned press for which job to show or log; it uses the launcher-chosen press (`S.assignedPressId`). The only place profile `assigned_press_id` affects behavior is when entering from launcher with a non-`press` choice (e.g. “OPEN” last choice), where it can supply the press id. So the mismatch is **database RLS** (single-press policies), not app logic, **if** the press-choose-any policy migration has not been applied.

---

## 5. Error-handling audit (“sync error” toast / message)

| Exact string | File | Function / origin | Call sites that can trigger it |
|--------------|------|-------------------|---------------------------------|
| **Sync error. Will retry.** | app.js | `window.addEventListener('unhandledrejection', ...)` (line 6–8) | Any unhandled promise rejection (e.g. from `Storage.logProgress` or `Storage.saveJob` if the rejection propagates and is not caught elsewhere). |
| **LOG FAILED** | storage.js | `Storage.logProgress` → `.catch(...)` → `setSyncState('error', { toastError: 'LOG FAILED' })` (line 306) | Only when `window.PMP.Supabase.logProgress(entry)` rejects (e.g. progress_log INSERT fails). `setSyncState` then calls `toastError('LOG FAILED')`. |
| **SAVE FAILED** | storage.js | `Storage.saveJob` or `Storage.savePresses` → `.catch(...)` → `setSyncState('error', { toast: 'SAVE FAILED' })` (lines 224, 244, 278) | When `saveJob` or `savePresses` Supabase call rejects (e.g. jobs or presses RLS denies). |
| **● ERR** (sync bar text) | storage.js | `SYNC_STATES.error.text` (line 44) | Whenever `setSyncState('error', ...)` is called (any of the above paths). |

So the user can see:
- Sync bar “● ERR” plus either **LOG FAILED** (toastError) or **SAVE FAILED** (toast), or
- **Sync error. Will retry.** (toastError) if an unhandled rejection occurs.

---

## 6. Manual reproduction path

- **User:** Signed in as press-role user (profile `role = 'press'`, e.g. `assigned_press_id = 'p1'`).
- **Launcher:** Choose a press (e.g. **Press 2**).
- **Press Station:** Assign a job to Press 2 from Admin first (or have it already assigned). In Press Station, ensure the job is shown, then click **LOG PRESSED** (e.g. with qty 25).
- **Function chain:** `psNumpadSubmit()` → `pressStationLogPressed(25)` → `logJobProgress(job.id, 'pressed', 25, 'Press Station')` → `Storage.logProgress({ job_id, qty: 25, stage: 'pressed', ... })` → `window.PMP.Supabase.logProgress(entry)` → `client.from('progress_log').insert(row)`.
- **DB call that fails:** `progress_log` **INSERT**.
- **Why it fails (if patch not applied):** RLS policy `progress_log_press_insert` (from rls-roles-migration.sql) has `WITH CHECK ( ... AND job_on_my_press(job_id) )`. `job_on_my_press(job_id)` is true only when the job is on `get_my_press_id()` (profile `assigned_press_id`). Job is on Press 2, profile is p1 → false → policy denies INSERT → Supabase returns error → promise rejects → `Storage.logProgress` catch runs → `setSyncState('error', { toastError: 'LOG FAILED' })` and sync bar shows “● ERR”. User may also see “Sync error. Will retry.” if the rejection is unhandled elsewhere.

Same logic applies for **Hold / Resume / Save note** with **jobs** UPDATE: old policy `jobs_press_update_own` uses `job_on_my_press(id)` → denied when job is on the chosen press that is not the profile’s assigned press.

---

## Deliverable: short report

### 1. Failing action

**Log pressed qty** (and, under the same RLS state, **Hold job**, **Resume job**, **Save note**). Primary user-visible failure is **Log pressed**.

### 2. Exact failing call

- **progress_log:** `client.from('progress_log').insert(row)` in `window.PMP.Supabase.logProgress(entry)` (supabase.js ~257–267), invoked by `Storage.logProgress` (storage.js ~304).
- **jobs (when applicable):** `client.from('jobs').upsert(row, { onConflict: 'id' })` in `window.PMP.Supabase.saveJob(job)` (supabase.js ~218–222), invoked by `Storage.saveJob` (storage.js ~215).

### 3. Why it fails

RLS allows press-role INSERT on `progress_log` and UPDATE on `jobs` only when the job is on the user’s **assigned** press (`job_on_my_press` / `get_my_press_id()`). The user is working on a **chosen** press (e.g. Press 2) that may differ from `assigned_press_id` (e.g. p1). For that job, `job_on_my_press(job_id)` is false, so the policy denies the write and Supabase returns an error.

### 4. Whether the problem is SQL, app logic, or both

**SQL (RLS).** The app correctly uses the launcher-chosen press and does not restrict writes to `assigned_press_id`. The database still enforces the old single-press rules because **press-choose-any-policy.sql** either has not been run or has not taken effect (e.g. wrong database or project).

### 5. Smallest likely fix

- **Confirm:** In the Supabase project used by the app, run (in SQL Editor) and verify no errors:
  - `supabase/press-choose-any-policy.sql`
  So that the three press policies use `job_on_any_press` / `id IN ('p1','p2','p3','p4')` instead of `job_on_my_press` / `get_my_press_id()`.
- **If the migration is already applied** and the error persists: verify that `get_my_role()` returns `'press'` for that user (e.g. `SELECT id, role, assigned_press_id FROM profiles WHERE id = auth.uid();` in SQL or after login in the app). If role is null or different, no press policy will allow the write; fix profile data or auth flow so the press user has `role = 'press'` when using Press Station.
