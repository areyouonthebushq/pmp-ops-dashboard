# PMP OPS — Write Path Audit

**Goal:** Source-of-truth map of every meaningful write/mutation path: what triggers it, function chain, target, awaited or not, success/failure UI, retry, role/RLS risk, and mobile impact. No patches applied.

**Storage layer:** `Storage` in storage.js (saveJob, deleteJob, updateJobAssets, savePresses, logProgress, logQC, saveTodos, saveJobs). Supabase path: `window.PMP.Supabase` (jobs, presses, progress_log, qc_log, todos). Local fallback: localStorage/safeSet when !useSupabase(). Offline: pushToOfflineQueue then replay on online.

---

## 1. Create job

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | FAB → New Job Chooser → "Manual Entry" → Wizard (steps 1–5) → "Save Job". |
| **Function chain** | `fabAction()` → `openNewJobChooser()` → `closeNewJobChooser(); openWizard()` → … → `wizardSave()` → `doWizardSave(job)` (or duplicate modal "Create Anyway" → `doWizardSave(pendingWizardJob)`). `doWizardSave`: build job, `setAssignment`/`releasePressByJob` if needed, `S.jobs.unshift(job)`, then `await Promise.all([Storage.savePresses(S.presses), Storage.saveJob(job)])`. |
| **Target table(s)** | `jobs` (upsert); optionally `presses` (if job has press assigned). |
| **Awaited or fire-and-forget** | **Awaited.** `doWizardSave` is async; caller awaits the Promise.all. |
| **Retry behavior** | `Storage.saveJob` uses `supabaseWithRetry` (one retry after 1500 ms). |
| **Success UI** | `closeWizard()`, `renderAll()`, toast "JOB ADDED". |
| **Failure UI** | catch: `toastError(e.message || 'Save failed')`; Storage also sets `setSyncState('error', { toast: 'SAVE FAILED' })`. |
| **Risk level** | Medium. No role check: QC (or any role that can open wizard) can create jobs. RLS may block; if not, UI is only boundary. |
| **Smallest hardening** | Gate wizard/FAB by role or canUseFullPanel; optionally add role check in doWizardSave and toast "Not allowed". Ensure RLS restricts job INSERT to admin (or intended roles). |

---

## 2. Edit / save job (panel)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Panel open (existing job) → EDIT → change fields → "SAVE JOB". |
| **Function chain** | `saveJob()` (app.js). Reads form via FIELD_MAP, builds job, merges progressLog/notesLog/assemblyLog from existing if edit, `setAssignment`/`releasePressByJob`, then `await Promise.all([Storage.savePresses(S.presses), Storage.saveJob(job)])`. |
| **Target table(s)** | `jobs` (upsert); `presses` (if assignment changed). |
| **Awaited or fire-and-forget** | **Awaited.** |
| **Retry behavior** | supabaseWithRetry in Storage.saveJob and savePresses. |
| **Success UI** | `closePanel()`, `renderAll()`, toast "JOB UPDATED" / "JOB ADDED". |
| **Failure UI** | catch: toastError(message) or "Save failed"; Storage sets sync state error. |
| **Risk level** | Low. Panel is only openable for existing job when canUseFullPanel (admin/guest); non-admin get floor card. |
| **Smallest hardening** | None required for path itself. |

---

## 3. Delete job

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Panel (existing job) → "DELETE JOB" → Confirm dialog → "CONFIRM". |
| **Function chain** | `confirmDel()` → `openConfirm(…, async () => { await Storage.deleteJob(id); releasePressByJob(id); S.jobs = S.jobs.filter(…); closePanel(); renderAll(); toast('JOB DELETED'); })`. Storage.deleteJob: `supabaseWithRetry(deleteChain)` where deleteChain = `Supabase.deleteJob(id).then(() => Supabase.savePresses(S.presses))`. |
| **Target table(s)** | `jobs` (delete row); then `presses` (upsert to clear job_id). |
| **Awaited or fire-and-forget** | **Awaited.** Confirm callback is async and awaited by click handler. |
| **Retry behavior** | supabaseWithRetry on the full deleteChain. |
| **Success UI** | Panel closes, list refreshes, toast "JOB DELETED". |
| **Failure UI** | catch: toastError('Delete failed'); Storage sets 'DELETE FAILED' toast. |
| **Risk level** | Low. DELETE only shown when S.mode === 'admin'. |
| **Smallest hardening** | Ensure RLS allows delete only for admin. |

---

## 4. Press log (LOG page)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | LOG page → Select job → PRESS → numpad qty → "LOG PRESS". |
| **Function chain** | `unifiedLogEnter()` (render.js) → `logJobProgress(S.logSelectedJob, 'pressed', n, 'Log')` (app.js). logJobProgress: mutate job.progressLog, optional status suggestion → `Storage.logProgress(entry)` then optionally `Storage.saveJob(job)` (if status suggested). Returns promise. |
| **Target table(s)** | `progress_log` (insert); optionally `jobs` (if status auto-updated). |
| **Awaited or fire-and-forget** | **Awaited.** unifiedLogEnter is async; awaits logJobProgress. |
| **Retry behavior** | supabaseWithRetry in Storage.logProgress and saveJob. |
| **Success UI** | Toast "+N pressed → JobName"; numpad cleared; renderLog(). |
| **Failure UI** | result.ok false → toastError(result.error); catch → toastError('Log failed'). logJobProgress catch also setSyncState('error', { toast: 'LOG FAILED' }). |
| **Risk level** | Medium. No role/capability check in unifiedLogEnter; floor_manager on LOG could submit if they reach it. |
| **Smallest hardening** | Check getStationEditPermissions().canLogPressProgress before calling logJobProgress for 'pressed'. |

---

## 5. QC pass (LOG page)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | LOG page → Select job → PASS → numpad qty → "LOG PASS". |
| **Function chain** | `unifiedLogEnter()` → `logJobProgress(S.logSelectedJob, 'qc_passed', n, 'Log')`. Same as press log; stage = 'qc_passed'. |
| **Target table(s)** | `progress_log` (insert); optionally `jobs` (status suggestion). |
| **Awaited or fire-and-forget** | **Awaited.** |
| **Retry behavior** | Same as 4. |
| **Success UI** | Toast "N QC passed → JobName"; clear; renderLog(). |
| **Failure UI** | Same as 4. |
| **Risk level** | Same as 4; add canLogQC check for pass/reject. |
| **Smallest hardening** | Check canLogQC for qc_pass (and rejected) paths. |

---

## 6. QC reject (LOG page)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | LOG page → Select job → REJECT → numpad qty → "LOG REJECT" → defect type buttons → e.g. "⚡ FLASH". |
| **Function chain** | `unifiedLogEnter()` → for reject: show reject picker; `unifiedLogRejectWithDefect(defectType)` → `await logJobProgress(S.logSelectedJob, 'rejected', n, 'Log')` then `await Storage.logQC({ time, type: defectType, job: jobName, date })`. |
| **Target table(s)** | `progress_log` (insert); `qc_log` (insert). |
| **Awaited or fire-and-forget** | **Awaited.** Both logJobProgress and Storage.logQC awaited. |
| **Retry behavior** | supabaseWithRetry for both. |
| **Success UI** | Toast "N DefectType → JobName"; picker closed; numpad cleared. |
| **Failure UI** | result.ok false or catch → toastError; reject picker hidden on error. |
| **Risk level** | Medium. Same role check gap as 4/5. |
| **Smallest hardening** | Check canLogQC before reject + logQC. |

---

## 7. Press station log

**Note:** Press Station shell purged. These paths are now accessed via LOG console and Floor. See `purgatory-protocol.md`.

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Press Station shell → numpad qty → "LOG +N PRESSED" (or "LOG PRESSED"). |
| **Function chain** | `psNumpadSubmit()` → `pressStationLogPressed(qty)` (stations.js). Checks `getStationEditPermissions().canLogPressProgress`; sets `S._pressStationWrite = true`; `await logJobProgress(job.id, 'pressed', qty, 'Press Station')`. |
| **Target table(s)** | `progress_log` (insert); optionally `jobs` (status). |
| **Awaited or fire-and-forget** | **Awaited.** |
| **Retry behavior** | Same. Storage catch clears _pressStationWrite and logs. |
| **Success UI** | Toast "+N logged"; renderPressStationShell(). |
| **Failure UI** | toastError(result.error || 'Log failed') or catch. |
| **Risk level** | Low. canLogPressProgress gated; only true in press station for press role (or admin in station). |
| **Smallest hardening** | None. |

---

## 8. Press station hold / resume / note

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Press Station → "Hold" / "Resume" / note field + save. |
| **Function chain** | `pressStationHold()` / `pressStationResume()` / `pressStationSaveNote()`: mutate job (status or notes), `S._pressStationWrite = true`, **Storage.saveJob(job)** (no await), renderPressStationShell(), toast. |
| **Target table(s)** | `jobs` (upsert). |
| **Awaited or fire-and-forget** | **Fire-and-forget.** Caller does not await Storage.saveJob. |
| **Retry behavior** | supabaseWithRetry inside Storage; on failure Storage sets sync state and rejects promise (unhandled by caller). |
| **Success UI** | Toast "Job on hold" / "Job resumed" / "Note saved"; shell re-renders. |
| **Failure UI** | User only sees sync bar "● ERR" and toast "SAVE FAILED" from Storage catch; no inline error in station. |
| **Risk level** | Medium. Fire-and-forget: UI assumes success; if save fails, local state is updated but DB is not; undo not available. |
| **Smallest hardening** | Await Storage.saveJob and on catch toastError and revert job status/notes locally (or show retry). |

---

## 9. Asset updates (panel)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Panel → Assets section → toggle received/N/A, expand detail, change date/person/note. No explicit "Save assets" in panel; assets are part of job. |
| **Function chain** | Asset toggles (e.g. toggleReceived) mutate curAssets, then **Storage.updateJobAssets** is not called from panel until **SAVE JOB**. So panel assets are saved only when user clicks "SAVE JOB" (same as edit/save job path). |
| **Target table(s)** | `jobs` (update assets column) via full job save. |
| **Awaited or fire-and-forget** | Awaited (part of saveJob). |
| **Retry / Success / Failure** | Same as "Edit / save job (panel)". |
| **Risk level** | Low. |
| **Smallest hardening** | None. |

---

## 10. Asset updates (assets overlay)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Floor/Jobs → click Assets on job → Assets overlay → edit → "SAVE & CLOSE" **or** "CANCEL" / ✕ / backdrop (currently all trigger save, see interaction audit). |
| **Function chain** | **Save:** `saveAssetsOverlay()` → flushAssetsOverlayInputs(), job.assets = copy of state, `Storage.updateJobAssets(job.id, job.assets).then(…).catch(…)`. **Close (no skipSave):** `closeAssetsOverlay()` → same: flush, assign job.assets, `Storage.updateJobAssets(...).then(...).catch(...)` (no await at call site). |
| **Target table(s)** | `jobs` (update assets column only via Supabase.updateJobAssets). |
| **Awaited or fire-and-forget** | **Save & CLOSE:** .then/.catch (not awaited by caller but chain runs). **CANCEL/✕/backdrop:** same, fire-and-forget from caller perspective. |
| **Retry behavior** | No supabaseWithRetry on updateJobAssets in storage.js (only direct Supabase call in retry). Check: updateJobAssets uses supabaseWithRetry in storage. Yes: `return supabaseWithRetry(function () { return window.PMP.Supabase.updateJobAssets(...) })`. |
| **Success UI** | Overlay closes, renderAll(), toast "ASSETS SAVED". |
| **Failure UI** | setSyncState('error', { toast: 'SAVE FAILED' }); toastError('Assets save failed'). |
| **Risk level** | Low for path; high for UX (Cancel/✕/backdrop save instead of discard — see interaction audit). |
| **Smallest hardening** | Make Cancel/✕/backdrop call closeAssetsOverlay(true) to discard. |

---

## 11. Panel notes (production / assembly)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Panel → Production notes or Assembly notes → type → "+ LOG NOTE". |
| **Function chain** | `addProductionNote()` / `addAssemblyNote()`: read text, push to job.notesLog or job.assemblyLog, set job.notes or job.assembly, **Storage.saveJob(job)** (no await), renderNotesSection(), toast "NOTE LOGGED". |
| **Target table(s)** | `jobs` (upsert full job including notesLog/assemblyLog). |
| **Awaited or fire-and-forget** | **Fire-and-forget.** |
| **Retry behavior** | supabaseWithRetry in Storage; failure → sync state + reject (unhandled). |
| **Success UI** | Toast "NOTE LOGGED"; notes list re-renders. |
| **Failure UI** | Sync bar and "SAVE FAILED" toast only; note appears in UI but may not be persisted. |
| **Risk level** | Medium. Same as press station hold/resume: optimistic UI, no revert on failure. |
| **Smallest hardening** | Await Storage.saveJob; on failure toastError and optionally revert note from log. |

---

## 12. Panel progress "+ LOG STACK"

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Panel → Progress section → Person, Stage, Qty → "+ LOG STACK". |
| **Function chain** | `submitProgressLog()` (app.js): `await logJobProgress(S.editId, stage, qty, person)`; if result.ok, clear qty, renderProgressSection(). |
| **Target table(s)** | `progress_log` (insert); optionally `jobs` (status suggestion). |
| **Awaited or fire-and-forget** | **Awaited.** |
| **Retry / Success / Failure** | Same as LOG page press/pass; toastError on failure. |
| **Risk level** | Low. Panel only for canUseFullPanel. |
| **Smallest hardening** | None. |

---

## 13. Apply suggested status (panel)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Panel → "Suggested: PRESSING — …" → "Apply". |
| **Function chain** | `applySuggestedStatus(jobId)`: j.status = suggestion.suggested, **Storage.saveJob(j)** (no await), update select, hide suggestion, renderAll(), toast. |
| **Target table(s)** | `jobs` (upsert). |
| **Awaited or fire-and-forget** | **Fire-and-forget.** |
| **Success / Failure UI** | Toast; failure only via sync bar. |
| **Risk level** | Medium. Fire-and-forget. |
| **Smallest hardening** | Await and handle failure (toast + revert status). |

---

## 14. Cycle status (floor card / panel pill)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Floor table status pill or panel status dropdown → click to cycle (e.g. queue → pressing → … → done). Confirm if marking done with incomplete progress. |
| **Function chain** | `cycleStatus(jid)` → optional confirm → `applyStatusCycle(j, prevStatus, next, jid)`: j.status = next, releasePressByJob/setAssignment as needed, **Storage.savePresses(S.presses)** (no await), **Storage.saveJob(j)** (no await), renderAll(), showUndoToast(…). Undo callback: revert j.status, press assignment, **Storage.savePresses**, **Storage.saveJob** (no await), renderAll(), toast "UNDONE". |
| **Target table(s)** | `jobs`; `presses`. |
| **Awaited or fire-and-forget** | **Fire-and-forget** (both main path and undo). |
| **Success UI** | Pill flash; undo toast with "UNDO" button. |
| **Failure UI** | Sync bar only; state can diverge from DB; undo also fire-and-forget so "UNDONE" may be wrong. |
| **Risk level** | High. Two writes (presses + job) and undo path same; no await anywhere. |
| **Smallest hardening** | Await both saves; on failure revert j.status and assignment and toastError. Undo: await saves and only then toast "UNDONE". |

---

## 15. Assign job to press (floor)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Floor page (admin) → Press card → "— ASSIGN JOB" dropdown → select job. |
| **Function chain** | `assignJob(pid, jid)` (stations.js): setAssignment(pid, jid), **Storage.savePresses(S.presses)** (no await), renderAll(). |
| **Target table(s)** | `presses` (upsert). |
| **Awaited or fire-and-forget** | **Fire-and-forget.** |
| **Success / Failure UI** | Grid re-renders; failure → sync bar. |
| **Risk level** | Medium. Assignment visible immediately; if save fails, press shows job but DB doesn’t. |
| **Smallest hardening** | Await Storage.savePresses; on failure revert setAssignment and renderAll(), toastError. |

---

## 16. Set press status (online/warning/offline/idle)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Floor page (admin) → Press card → status dropdown. |
| **Function chain** | `setPressStatus(pid, st)`: p.status = st, **Storage.savePresses(S.presses)** (no await), renderAll(). |
| **Target table(s)** | `presses` (upsert). |
| **Awaited or fire-and-forget** | **Fire-and-forget.** |
| **Risk level** | Medium. Same as assign. |
| **Smallest hardening** | Await and revert on failure. |

---

## 17. Floor card quick edit

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Floor card overlay → QUICK EDIT → change fields → "SAVE". |
| **Function chain** | `saveFloorCardQuickEdit()` (render.js): read fcStatus, fcPress, etc., mutate j, **Storage.saveJob(j)** (no await), exit edit mode, renderFloorCard(), renderFloor/renderPresses. |
| **Target table(s)** | `jobs` (upsert). |
| **Awaited or fire-and-forget** | **Fire-and-forget.** |
| **Success UI** | Edit mode off; card shows new values. |
| **Failure UI** | Sync bar only. |
| **Risk level** | Medium. |
| **Smallest hardening** | Await Storage.saveJob; on failure toastError and re-render from S (no revert needed if we don’t mutate until success). |

---

## 18. CSV import

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Jobs page → "↑ IMPORT CSV" → choose file. |
| **Function chain** | `importCSV(input)` (app.js): parse CSV, match columns, build rows, setAssignment for each with press, then **Promise.all([Storage.saveJobs(toSave), Storage.savePresses(S.presses)]).then(…).catch(…)**. Not awaited by importCSV itself (no async) but promise is chained. |
| **Target table(s)** | `jobs` (multiple upserts); `presses` (upsert). |
| **Awaited or fire-and-forget** | Fire-and-forget from caller (synchronous function); .then/.catch handle result. |
| **Success UI** | renderAll(), toast "N JOBS IMPORTED". |
| **Failure UI** | setSyncState('error', { toast: 'IMPORT FAILED: …' }); renderAll(). |
| **Risk level** | Medium. Large batch; partial failure leaves some jobs saved and some not; no per-row rollback. |
| **Smallest hardening** | Consider transaction or batch API if Supabase supports; or save in sequence and stop on first failure and report which row. |

---

## 19. Todos (daily/weekly/standing)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Todos page (if enabled) → add task, toggle done, remove. |
| **Function chain** | Storage.saveTodos(todos) — called from app when todos change. **Role check:** `if (role !== 'admin' && role !== 'floor_manager') return Promise.resolve()` so other roles do not trigger write. |
| **Target table(s)** | `todos` (upsert rows). |
| **Awaited or fire-and-forget** | Call sites may or may not await; Storage returns promise. |
| **Risk level** | Low. Role-gated in Storage. |
| **Smallest hardening** | None. |

---

## 20. Offline queue and replay

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Any write while offline (navigator.onLine false or S.offlineMode): saveJob → pushToOfflineQueue('job_status', { jobId, status }); logProgress → pushToOfflineQueue('progress', entry); logQC → pushToOfflineQueue('qc', entry); updateJobAssets → pushToOfflineQueue('job_assets', { jobId, assets }). On online: `onOnline()` → loadAll().then(replayQueue).then(loadAll).catch(…). |
| **Function chain** | **Replay:** `replayQueue()` (storage.js): for each item, if progress → await Supabase.logProgress(payload); if qc → await Supabase.logQC(payload); if job_status → find job in S.jobs, job.status = payload.status, await Supabase.saveJob(job); if job_assets → find job, job.assets = payload.assets, await Supabase.updateJobAssets(jobId, assets). On first failure, push item and remaining back to queue, break. |
| **Target table(s)** | progress_log, qc_log, jobs (full upsert for status replay), jobs.assets. |
| **Awaited or fire-and-forget** | Replay is awaited in onOnline chain. Each item awaited sequentially. |
| **Retry behavior** | No automatic retry for replay; failed items stay in queue. User can retry by going offline/online again (replay runs again). |
| **Success UI** | setSyncState('synced'); S.offlineMode = false; updateOfflineBanner. |
| **Failure UI** | setSyncState('error', { toast: 'Sync failed after reconnect' }); remaining items stay in queue. |
| **Risk level** | Medium. job_status replay does full saveJob(job) so in-memory job (possibly stale) overwrites server; race with other edits. job_assets replay is targeted. |
| **Smallest hardening** | For job_status, consider only PATCHing status if API supports; or fetch latest job then apply status and save to reduce overwrite. Document replay order and conflict window. |
| **Mobile** | Offline more likely; replay on resume/lock. No change to path logic. |

---

## 21. Initial presses (first load)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | loadAllData (storage.js) when useSupabase() and data.presses empty or length 0. |
| **Function chain** | `Storage.loadAllData()` → `window.PMP.Supabase.loadAllData()`; if !data.presses || data.presses.length === 0, set data.presses = DEFAULT_PRESSES, then **await window.PMP.Supabase.savePresses(data.presses).catch(() => {})**. |
| **Target table(s)** | `presses` (upsert). |
| **Awaited or fire-and-forget** | Awaited (inside loadAllData). Failure swallowed (.catch empty). |
| **Success / Failure UI** | No user-facing success; failure silent. |
| **Risk level** | Low. One-time bootstrap. |
| **Smallest hardening** | Optional: log or setSyncState on failure. |

---

## 22. Realtime (no write)

| Field | Detail |
|-------|--------|
| **Initiating UI/action** | Supabase Realtime subscription on jobs, presses, todos, progress_log, qc_log. |
| **Function chain** | subscribeRealtime(onChange) → on any INSERT/UPDATE/DELETE → onChange() → typically loadAll() or debounced refetch. |
| **Target table(s)** | None (read path). No write from realtime. |
| **Risk level** | N/A. |

---

## Summary table: awaited vs fire-and-forget

| Write path | Awaited? | Failure visible beyond sync bar? |
|------------|----------|----------------------------------|
| Create job (wizard) | Yes | Yes (toast) |
| Edit/save job (panel) | Yes | Yes (toast) |
| Delete job | Yes | Yes (toast) |
| Press log (LOG page) | Yes | Yes (toast) |
| QC pass (LOG page) | Yes | Yes (toast) |
| QC reject (LOG page) | Yes | Yes (toast) |
| Press station log | Yes | Yes (toast) |
| Press station hold/resume/note | No | Sync bar + toast from Storage only |
| Asset updates (panel) | Yes (with SAVE JOB) | Yes |
| Asset updates (overlay) | No at caller | Yes (toast on catch) |
| Panel notes | No | No (sync bar only) |
| Panel + LOG STACK | Yes | Yes |
| Apply suggested status | No | No |
| Cycle status + undo | No | No |
| Assign job (press) | No | No |
| Set press status | No | No |
| Floor card quick edit | No | No |
| CSV import | No (promise chain) | Yes (toast) |
| Offline replay | Yes (in onOnline) | Yes (toast on reconnect failure) |
| Initial presses | Yes | Silent |

---

## Confirmed stable write paths

- **Create job (wizard):** Awaited, retry, clear success/failure.
- **Edit/save job (panel):** Awaited, retry, close panel and toast.
- **Delete job:** Awaited, retry, confirm and toast.
- **LOG page press/pass/reject:** Awaited, retry, toast and clear numpad.
- **Press station log pressed:** Awaited, permission check, toast.
- **Panel + LOG STACK:** Awaited, same as LOG.
- **Assets overlay SAVE & CLOSE:** Promise chain with catch; user sees toast on failure.
- **Offline queue replay:** Sequential await; failure leaves queue and shows toast.

---

## Suspicious write paths

- **Press station hold/resume/note:** Fire-and-forget; no revert on failure; user told "Job on hold" etc. but save might fail.
- **Panel notes (+ LOG NOTE):** Fire-and-forget; note appears in UI but might not persist; no error in panel.
- **Apply suggested status:** Fire-and-forget; status pill updates, DB might not.
- **Cycle status and undo:** Fire-and-forget for both apply and undo; state and DB can diverge; undo can "succeed" in UI and fail in DB.
- **Assign job / set press status:** Fire-and-forget; grid shows new state; save failure only in sync bar.
- **Floor card quick edit:** Fire-and-forget; card shows new values; failure only sync bar.
- **Assets overlay Cancel/✕/backdrop:** Triggers save (not discard); user expects discard (see interaction audit).

---

## Unnecessary background writes

- **Initial presses save:** Only when presses table empty; one-time. Not unnecessary but hidden.
- No other redundant background writes identified. Realtime does not write.

---

## Top 10 write risks

1. **Cycle status + undo fire-and-forget** — Two writes (presses + job) and undo path; no await; state/DB divergence and "UNDONE" can be wrong. **Fix:** Await both saves; on failure revert and toast; undo await then toast.
2. **Panel notes fire-and-forget** — Note appears logged but save may fail; no inline error. **Fix:** Await Storage.saveJob; on failure toastError and optionally remove last note from log.
3. **Press station hold/resume/note fire-and-forget** — Same pattern. **Fix:** Await and on failure revert and toastError.
4. **Assign job / set press status fire-and-forget** — Assignment/status visible; DB may not update. **Fix:** Await Storage.savePresses; on failure revert and toastError.
5. **Apply suggested status fire-and-forget** — **Fix:** Await Storage.saveJob; on failure revert status and toastError.
6. **Floor card quick edit fire-and-forget** — **Fix:** Await Storage.saveJob; on failure toastError.
7. **Assets overlay Cancel/✕/backdrop saves** — User expects discard; all three currently save. **Fix:** closeAssetsOverlay(true) for Cancel, ✕, and backdrop.
8. **Offline job_status replay** — Full saveJob(job) can overwrite concurrent edits. **Fix:** Consider status-only update or fetch-modify-save to reduce overwrite.
9. **CSV import partial failure** — Batch save; one failure leaves some jobs saved. **Fix:** Sequential save with stop-on-first-failure and report row; or transaction if available.
10. **No role check on create job** — QC (or any role with wizard access) can create jobs; RLS may be only backend guard. **Fix:** Gate wizard/FAB by role; ensure RLS restricts job INSERT.

---

## Role / RLS and mobile

- **Role:** Create job, delete job, and panel save are UI-gated (panel/delete only for admin). Wizard create has no role check (QC can add jobs). LOG submit has no canLogPressProgress/canLogQC check. Storage.saveTodos checks role (admin/floor_manager only).
- **RLS:** If Supabase RLS restricts jobs/presses/progress_log/qc_log by role or assignment, failures will surface as save/log errors. If RLS is permissive, UI is the only boundary for create/delete/assign.
- **Mobile:** Same paths; offline queue and replay matter more on mobile. supabaseWithRetry (one retry after 1.5s) helps flaky networks. No separate mobile-only write path.

---

*End of audit. No patches applied.*
