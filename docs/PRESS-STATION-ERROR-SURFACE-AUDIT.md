# Press Station sync error — exact error surface (audit only)

No code changed. Purpose: shortest path to the raw Supabase error.

---

## 1. Every code path that can produce visible "sync error" / "LOG FAILED" / "SAVE FAILED"

| Visible text | File | Line | Trigger (code path) |
|--------------|------|------|----------------------|
| **Sync error. Will retry.** | app.js | 8 | `window.addEventListener('unhandledrejection', ...)` — any unhandled promise rejection. Fires when `Storage.logProgress` or `Storage.saveJob` rejects and nothing awaits/catches that promise. |
| **LOG FAILED** | storage.js | 306 | `Storage.logProgress` → `.catch(...)` → `setSyncState('error', { toastError: 'LOG FAILED' })` → `toastError('LOG FAILED')`. Trigger: `window.PMP.Supabase.logProgress(entry)` rejects (e.g. progress_log INSERT fails). |
| **SAVE FAILED** | storage.js | 224 | `Storage.saveJob` → `.catch(...)` → `setSyncState('error', { toast: 'SAVE FAILED' })` → `toast('SAVE FAILED')`. Trigger: `window.PMP.Supabase.saveJob(job)` rejects (e.g. jobs UPDATE fails). |
| **SAVE FAILED** | storage.js | 244 | `Storage.updateJobAssets` → `.catch(...)` → same. Trigger: updateJobAssets Supabase call fails. (Not used from Press Station.) |
| **SAVE FAILED** | storage.js | 278 | `Storage.savePresses` → `.catch(...)` → same. Trigger: savePresses Supabase call fails. (Not used from Press Station UI.) |
| **Log failed** (lowercase) | stations.js | 397 | `pressStationLogPressed` → `logJobProgress` returns `{ ok: false, error: '...' }` → `toastError(result.error \|\| 'Log failed')`. Trigger: **synchronous** validation failure in `logJobProgress` (job not found, invalid stage, qty invalid, etc.) — **not** a Supabase/network failure. |

**Sync bar "● ERR":** Shown whenever `setSyncState('error', ...)` runs (any of the storage.js catch blocks above).

**Press Station–relevant paths only:**

- **LOG FAILED** + sync bar ERR: `pressStationLogPressed` → `logJobProgress` → `Storage.logProgress(...)` (not awaited) → later Supabase `progress_log` INSERT fails → storage.js line 306 catch.
- **SAVE FAILED** + sync bar ERR: (1) Same click: `logJobProgress` optionally calls `Storage.saveJob(job)` (not awaited) → Supabase `jobs` upsert fails → storage.js line 224 catch. (2) Or: Hold / Resume / Save note → `Storage.saveJob(job)` → same catch.
- **Sync error. Will retry.:** Same failures as above; the rejected promise is not awaited, so `unhandledrejection` also fires (often in addition to LOG FAILED or SAVE FAILED).

---

## 2. Can Press Station "log pressed" show a sync error after a successful DB write?

**Yes.**

- `logJobProgress` does **not** await `Storage.logProgress` or `Storage.saveJob`. It returns `{ ok: true }` immediately after calling them, so the UI can show "+N logged" before any Supabase response.
- Two async writes can run for one "Log pressed" click:
  1. `Storage.logProgress(...)` → `progress_log` INSERT.
  2. If `suggestedStatus` suggests `pressing` or `done`, `Storage.saveJob(job)` → `jobs` UPDATE (upsert).

So:

- If **progress_log INSERT succeeds** and **jobs UPDATE fails** (e.g. RLS blocks the job update), the user can see "+25 logged" and then **SAVE FAILED** and sync bar error. The visible error is then from the **second** call (saveJob), not the first (logProgress).
- **Not** caused by realtime/loadAll: when realtime fires after a successful write, `loadAll()` runs; its `catch` sets `setSyncState('offline')` or `setSyncState('local')` and does **not** set `setSyncState('error', { toast: ... })`, so realtime/loadAll do not produce "LOG FAILED" / "SAVE FAILED" or the generic "Sync error. Will retry." from the app handler.

---

## 3. Smallest code change to log the raw Supabase error for Press Station actions only

Goal: log the full error object (e.g. `e.code`, `e.message`, `e.details`) only when the failing call originated from Press Station.

**Option A (minimal, two touches):**

1. **stations.js** — before calling into app/storage from Press Station, set a flag:
   - In `pressStationLogPressed`: set `S._pressStationWrite = true` before `logJobProgress(job.id, ...)`.
   - In `pressStationHold`, `pressStationResume`, `pressStationSaveNote`: set `S._pressStationWrite = true` before `Storage.saveJob(job)`.

2. **storage.js** — in the `.catch` of `logProgress` (line 306) and the `.catch` of `saveJob` (line 221):
   - If `S._pressStationWrite` is true: `console.error('[PMP] Press Station Supabase error', e?.code, e?.message, e?.details, e);` (and optionally clear `S._pressStationWrite` after logging).

**Caveat:** `logJobProgress` (app.js) can call both `Storage.logProgress` and `Storage.saveJob`; it does not know about `S._pressStationWrite`. So set `S._pressStationWrite = true` in `pressStationLogPressed` once before `logJobProgress`; both the logProgress and saveJob calls that run as a result of that click will see the flag. Clear the flag in the catch blocks (or in a `.finally` in storage) so Hold/Resume/Save note can set it again.

**Option B (no flag, always log full error for these two methods):**  
In storage.js only, in the `.catch` of `logProgress` (306) and `saveJob` (221), add one line each:  
`console.error('[PMP] Supabase error', e?.code, e?.message, e?.details, e);`  
This logs for every logProgress/saveJob failure (not Press Station–only), but is the smallest single-file change and still exposes the raw error for Press Station flows.

---

## 4. Exact place to inspect in DevTools Network for the failing request

- **Tab:** DevTools → **Network**.
- **Filter:** By host or path:
  - Host: `ygqsnijpattxxqdvwsow.supabase.co`  
  - Or path contains: `rest/v1/`
- **Request to find:**
  - **progress_log (Log pressed):** Method **POST**, URL  
    `https://ygqsnijpattxxqdvwsow.supabase.co/rest/v1/progress_log`  
    (may include `?` query for apikey). Request payload: JSON with `job_id`, `qty`, `stage`, `person`, `timestamp`.
  - **jobs (Hold/Resume/Note or status suggestion after Log pressed):** Method **POST**, URL  
    `https://ygqsnijpattxxqdvwsow.supabase.co/rest/v1/jobs`  
    with header `Prefer: return=minimal` and body = job row (or PATCH to same resource depending on client).
- **Which one failed:** Red/failed request (status 403, 400, 500, etc.). Click it → **Response** (or **Preview**) tab. Supabase returns JSON with `code` and `message` (and optionally `details`, `hint`). That body is the raw error the client receives and throws; the same shape is what you want in the console log (see §3).

**Shortest path:** Reproduce the Press Station sync error → open Network, filter by `supabase` or `rest/v1` → find the red request → open Response. That response body is the exact failing error.
