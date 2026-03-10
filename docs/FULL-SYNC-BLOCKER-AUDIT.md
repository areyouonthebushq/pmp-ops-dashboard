# PMP OPS — Full Sync / Blocker Stabilization Audit

**Scope:** Desktop flows, mobile flows, auth/session, realtime/sync, persistence, role/RLS UI mismatches, layout/responsiveness, touch/mobile interaction, demo vs production blockers.  
**Type:** Audit only. No patches applied.

---

## A. Core flows audited

- Launcher
- Admin floor
- Jobs
- Right-side panel (slide panel)
- Press station
- LOG page
- Audit page
- Exit / back / launcher return
- Sign in / session restore / sign out

---

## B–D. Findings (by severity, then flow)

### BLOCKER

**1. Confirm dialog delete job — unhandled promise rejection**  
- **Severity:** blocker  
- **Platform:** both  
- **Page/flow:** Right-side panel → DELETE JOB → CONFIRM  
- **Reproduction:** Open job panel → Delete → Confirm. If `Storage.deleteJob(id)` rejects (e.g. network/RLS), the async callback throws and the promise is never caught.  
- **Expected:** User sees "DELETE FAILED" (or similar) and panel state is consistent.  
- **Current:** Rejection is unhandled; global handler shows "Sync error. Will retry." and panel may already be closed.  
- **Root cause:** `document.getElementById('confOk').addEventListener('click', () => { if (confCb) confCb(); closeConfirm(); });` — `confCb` is async and its returned promise is not awaited or `.catch()`'d.  
- **Fix:** In the click handler, treat confCb as async: `if (confCb) Promise.resolve(confCb()).catch(e => { toastError(e?.message || 'Delete failed'); }).finally(closeConfirm);` and in confirmDel callback wrap `Storage.deleteJob` in try/catch, show toast on error, and do not close panel on failure.

**2. Offline queue does not replay job_assets**  
- **Severity:** blocker (for offline asset updates)  
- **Platform:** both  
- **Page/flow:** User edits assets (panel or assets overlay) while offline; queue stores `job_assets`; on online, replay runs.  
- **Expected:** Queued asset updates are replayed and DB matches user intent.  
- **Current:** `replayQueue()` only handles `progress`, `qc`, `job_status`. `job_assets` items are never replayed and are left in the queue until discarded.  
- **Root cause:** `pushToOfflineQueue('job_assets', { jobId, assets })` in `Storage.updateJobAssets` when offline, but `replayQueue()` has no branch for `job_assets`.  
- **Fix:** In `replayQueue()`, add branch for `item.type === 'job_assets'`: load job from S.jobs, set job.assets from payload, call `window.PMP.Supabase.updateJobAssets(item.payload.jobId, item.payload.assets)` (with same retry pattern as other writes).

**3. logJobProgress / LOG write — fire-and-forget Storage promise**  
- **Severity:** blocker (for surfacing LOG write failures)  
- **Platform:** both  
- **Page/flow:** LOG page → enter quantity → LOG PRESS / LOG PASS / defect for REJECT.  
- **Expected:** If `Storage.logProgress` or `Storage.saveJob` (status suggestion) fails, user sees "LOG FAILED" and state is consistent.  
- **Current:** `logJobProgress()` calls `Storage.logProgress(entry)` and optionally `Storage.saveJob(job)` without awaiting. Rejections from Storage surface only via setSyncState('error') and global unhandledrejection ("Sync error. Will retry."). UI has already shown success toast and cleared numpad.  
- **Root cause:** Synchronous validation returns `{ ok: true }` and UI updates immediately; persistence is async and not awaited.  
- **Fix:** Have LOG entry points (unifiedLogEnter, unifiedLogRejectWithDefect) await the write: e.g. return a promise from logJobProgress (resolve with { ok } after Storage succeeds, reject on Storage failure), or have them call Storage.logProgress/.saveJob and await + catch to show toastError and not clear numpad on failure.

**4. onOnline — unhandled rejection**  
- **Severity:** blocker (when coming back online with queue)  
- **Platform:** both  
- **Page/flow:** Go offline, queue some writes, come back online.  
- **Expected:** loadAll and replayQueue run; any failure is surfaced (toast/sync bar).  
- **Current:** `loadAll().then(() => replayQueue()).then(() => loadAll())` has no `.catch()`. If loadAll or replayQueue throws, rejection is unhandled.  
- **Root cause:** No catch on the promise chain in `onOnline()`.  
- **Fix:** Add `.catch((e) => { console.error(e); setSyncState('error', { toast: 'Sync failed after reconnect' }); })` (and optionally leave banner/queue visible).

---

### HIGH

**5. Asset overlay / panel asset save — failure swallowed**  
- **Severity:** high  
- **Platform:** both  
- **Page/flow:** Panel or assets overlay → save assets.  
- **Expected:** On failure, user sees "SAVE FAILED" and overlay stays open or re-opens.  
- **Current:** `Storage.updateJobAssets(job.id, job.assets).then(...).catch(() => {});` — catch is empty; sync bar may show ERR but no toast; user may think save succeeded.  
- **Root cause:** render.js (closeAssetsOverlay, saveAssetsOverlay) and panel asset save path use `.catch(() => {})`.  
- **Fix:** Replace with `.catch((e) => { setSyncState('error', { toast: 'SAVE FAILED' }); if (typeof toastError === 'function') toastError('Assets save failed'); })` and do not clear overlay state on failure.

**6. Auth: fetchAndStoreProfile rejection on SIGNED_IN**  
- **Severity:** high  
- **Platform:** both  
- **Page/flow:** Sign in or session restore; Supabase fires SIGNED_IN; code runs `fetchAndStoreProfile(session.user.id).then(() => showLauncher())`.  
- **Expected:** If getProfile fails, user sees an error and does not get launcher with wrong/missing role.  
- **Current:** No `.catch()` on that chain. If getProfile rejects, unhandled rejection; launcher may still show (if then() already ran) or not; `window.PMP.userProfile` may be null so getAuthRole() is null and mayEnterStation(..., null) returns true — over-permissive.  
- **Root cause:** onAuthStateChange callback does not handle fetchAndStoreProfile failure.  
- **Fix:** Add `.catch((e) => { console.error(e); showLoginScreen(false); toastError('Could not load profile'); })` and do not show launcher until profile is stored.

**7. Audit page: getAuditLog throws; loadAuditPage catches but hint can be generic**  
- **Severity:** high (for admin demo)  
- **Platform:** both  
- **Page/flow:** Admin → Audit → LOAD (or navigate to audit).  
- **Expected:** On RLS or network error, user sees clear "Error: …" or "Audit requires Supabase and admin role."  
- **Current:** getAuditLog throws on error; loadAuditPage catches and sets hintEl and emptyEl. If error.message is missing, hint is "Error: Failed to load". Role check is correct (admin + Supabase).  
- **Root cause:** Minor: error message could be more specific for 403 vs network.  
- **Fix:** In loadAuditPage catch block, set hint to e?.code === 'PGRST301' or e?.message?.includes('403') ? 'Access denied (admin only).' : ('Error: ' + (e?.message || 'Failed to load')).

**8. Realtime loadAll during panel open — data changed notice vs stale panel**  
- **Severity:** high  
- **Platform:** both  
- **Page/flow:** User has panel open; another device/tab updates data; realtime fires; loadAll runs after 300 ms; S.dataChangedWhileEditing set, dataChangedNotice shown.  
- **Expected:** User clicks "Refresh view", loadAll runs, panel re-renders with latest job data.  
- **Current:** dismissDataChangedNotice() calls loadAll() and hideDataChangedNotice(). loadAll() replaces S.jobs; if panel is still open for S.editId, panel body is not re-built from updated job — so panel can show stale fields until user closes and re-opens.  
- **Root cause:** Panel content was filled at openPanel(); there is no listener that re-fills panel from S when S.jobs changes.  
- **Fix:** When dismissDataChangedNotice() runs and panel is open, after loadAll() re-run the panel fill logic for S.editId (or close panel and show toast "Data refreshed; please re-open the job.").

**9. LOG page: #pg-log.on display rule — correct**  
- **Severity:** N/A (fixed in prior pass)  
- **Note:** #pg-log uses `#pg-log.on { display: flex; ... }` so the LOG page is hidden when not active. No duplicate with Audit.

**10. Mobile: LOG console 3-column block kept**  
- **Severity:** N/A (fixed in prior pass)  
- **Note:** At 600px the console no longer stacks to a single column; min-width 260px and reduced padding/fonts avoid overlap. No new blocker found.

---

### MEDIUM

**11. saveJob (panel) — duplicate job open vs save**  
- **Severity:** medium  
- **Platform:** both  
- **Page/flow:** New job, enter catalog/artist that duplicates existing; save; modal "JOB ALREADY EXISTS" with OPEN EXISTING.  
- **Expected:** User can open existing or cancel; no double-save.  
- **Current:** If user clicks OPEN EXISTING, openPanel(existing.id) is called and duplicate modal closes; saveJob is not called again. Behavior is correct.  
- **Root cause:** None.  
- **Fix:** None. Document only.

**12. CSV import — Promise.all saveJobs/savePresses catch**  
- **Severity:** medium  
- **Platform:** both  
- **Page/flow:** Jobs page → Import CSV → select file.  
- **Expected:** On save failure, user sees "IMPORT FAILED: …" and sync state updates.  
- **Current:** `.catch((e) => { ... setSyncState('error', { toast: 'IMPORT FAILED: ' + ... }); renderAll(); })` — handled.  
- **Root cause:** None.  
- **Fix:** None.

**13. Role vs UI: saveTodos only for admin/floor_manager**  
- **Severity:** medium  
- **Platform:** both  
- **Page/flow:** loadAll() always calls `Storage.saveTodos(S.todos)` after merging. Storage.saveTodos returns resolved promise without writing when role is not admin/floor_manager.  
- **Expected:** Non-admin does not write todos; UI does not show Todos nav for them (nav item hidden by role).  
- **Current:** Correct. No RLS mismatch from client.  
- **Fix:** None.

**14. Mobile: viewport and tap targets**  
- **Severity:** medium  
- **Platform:** mobile  
- **Page/flow:** Use LOG console, panel, nav, launcher on small touch device.  
- **Expected:** No double-tap zoom on buttons; tap targets ≥ ~44px where possible.  
- **Current:** Viewport has `user-scalable=no` and `maximum-scale=1.0`; touch-action: manipulation on numpad/LOG faceplate; many buttons have min-height 36–56px. Some nav-item / bar-btn padding could be smaller on very narrow screens.  
- **Root cause:** General small-screen tuning, not a single bug.  
- **Fix:** Ensure all primary actions (LOG enter, mode buttons, panel save, launcher buttons) have min-height ≥ 44px and touch-action: manipulation where needed; avoid small tap targets in table cells.

**15. Panel open with no job (new job) — S.editId null**  
- **Severity:** medium  
- **Platform:** both  
- **Page/flow:** Open panel for new job; realtime loads; loadAll replaces S.jobs; new job not in S yet.  
- **Expected:** Panel stays in "new job" state; on save we create id and push to S.  
- **Current:** No re-fill for new job; panel fields are user input only. Safe.  
- **Fix:** None.

---

### LOW

**16. Floor card quick-edit vs full panel by role**  
- **Severity:** low  
- **Platform:** both  
- **Page/flow:** Non-admin (e.g. press) opens a job from floor; getStationEditPermissions() returns canUseFullPanel: false; openPanel(id) redirects to openFloorCard(id).  
- **Expected:** User only sees floor card fields (status, press, location, etc.), not full panel.  
- **Current:** Implemented.  
- **Fix:** None.

**17. Press station / QC station back button**  
- **Severity:** low  
- **Platform:** both  
- **Page/flow:** In Press or QC station, click ← BACK.  
- **Expected:** Admin returns to admin app; operator logs out to launcher.  
- **Current:** returnToAdmin() or doLogout() per role. Correct.  
- **Fix:** None.

**18. Guest demo — no Supabase**  
- **Severity:** low  
- **Platform:** both  
- **Page/flow:** Click GUEST DEMO; PMP_GUEST_MODE = true; userProfile.role = 'admin'; launcher shows.  
- **Expected:** All client-side flows work; no real writes.  
- **Current:** useSupabase() is false when Supabase not inited or guest; Storage uses local only. Safe for demo.  
- **Fix:** None.

**19. Sync bar states**  
- **Severity:** low  
- **Platform:** both  
- **Page/flow:** After any write, sync bar shows SYNCED / ERR / SAVING / etc.  
- **Expected:** User can infer success or failure.  
- **Current:** setSyncState('error', { toast: '...' }) used on most write failures; some paths (assets) swallow and only setSyncState.  
- **Fix:** See asset overlay fix above.

**20. Mobile: table horizontal scroll**  
- **Severity:** low  
- **Platform:** mobile  
- **Page/flow:** Floor / Jobs table on narrow width.  
- **Expected:** Horizontal scroll, no layout break.  
- **Current:** .tbl-wrap { overflow-x: auto; }. Good.  
- **Fix:** None.

---

## Top 10 blockers / risks

1. **Confirm delete job** — Unhandled promise rejection when delete fails; panel closes before user sees error.  
2. **Offline job_assets** — Queued asset updates never replayed after reconnect.  
3. **LOG write fire-and-forget** — logProgress/saveJob not awaited; success shown before persistence; failures only via global handler.  
4. **onOnline chain** — loadAll/replayQueue/loadAll with no catch; unhandled rejection on reconnect.  
5. **Asset save (overlay/panel)** — updateJobAssets failure swallowed; user may believe save succeeded.  
6. **Auth profile load** — fetchAndStoreProfile rejection on sign-in not caught; launcher can show with null profile (over-permissive role).  
7. **Data changed notice + panel** — After "Refresh view", panel content can remain stale until re-open.  
8. **Audit page error copy** — 403 vs generic "Failed to load" could be clearer for admin.  
9. **Realtime self-echo** — 1s window and panel-opened 2.5s ignore are in place; minor risk of double-apply on very fast edits.  
10. **Conflict window (jobs)** — 10s pendingWrites; if server is slow, conflict detection can clear pending too early or miss conflict.

---

## Top 5 mobile-specific risks

1. **Tap targets** — Some bar-btn / nav-item / table controls may be &lt; 44px in one axis on very narrow screens; double-tap zoom largely prevented by viewport.  
2. **LOG console** — min-width 260px can cause horizontal scroll on very narrow portrait; acceptable.  
3. **Panel form** — Long form; overflow-y: auto on panel-body; no sticky save/cancel on small viewports.  
4. **Station shells (Press/QC)** — Full-screen overlay; content can be long; ensure scroll and back button always reachable.  
5. **Launcher** — Buttons and press row; already reasonable min-heights; no landscape-specific layout.

---

## Top 5 sync / persistence risks

1. **LOG progress / status save** — Not awaited; failure only via setSyncState and unhandledrejection.  
2. **Offline job_assets** — Not replayed; asset edits lost until user edits again online.  
3. **onOnline** — No catch; reconnect can throw and leave queue/banner in inconsistent state.  
4. **Panel save** — saveJob is awaited in try/catch; good. deleteJob (confirm) is not awaited by caller — rejection unhandled.  
5. **loadAll after realtime** — Replaces S.jobs; panel and any in-memory draft (e.g. unsaved panel) can become stale; data changed notice does not re-populate open panel.

---

## What is demo-safe right now

- **Guest demo (no auth):** Launcher, floor view, jobs list, panel open/new job (no real save), LOG page UI and numpad (writes go to local only when Supabase not inited). No audit, no backup export if hidden by role.  
- **Signed-in admin (Supabase):** Full flow: launcher → admin → floor, jobs, panel save/delete, LOG, audit, export, backup. Realtime and polling work.  
- **Signed-in press/qc:** Launcher → station; LOG and press logging work; panel restricted to floor card or read-only where intended.  
- **Mobile:** LOG console is a 3-column block; no single-column stack. Page framing and shell are consistent.  
- **Avoid during demo:** Delete job when network is flaky (rejection not surfaced cleanly). Rely on asset saves while offline (queue not replayed). Assume "Refresh view" after data changed refreshes the open panel content (it does not re-fill panel).

---

## What should not be touched before demo

- **Auth/session flow** — Bootstrap, getSession, fetchAndStoreProfile, onAuthStateChange. Only add .catch for profile load and ensure launcher is not shown on profile failure.  
- **Realtime subscription** — Do not change event list or debounce logic; only consider re-fill panel on dismissDataChangedNotice.  
- **Storage layer** — Do not change saveJob/savePresses/logProgress/logQC/deleteJob signatures; add replay for job_assets and fix confirm delete handler.  
- **LOG console layout** — Do not revert to single-column on mobile; do not change grid or faceplate structure.  
- **Role/permissions** — getAuthRole, mayEnterStation, getStationEditPermissions; no logic change; only ensure profile load failure does not grant over-permissive access.

---

## File reference (for fixes)

| Area              | File      | Relevant symbols / lines (approx)     |
|-------------------|-----------|---------------------------------------|
| Confirm delete    | app.js    | confirmDel, openConfirm, confOk click |
| Offline replay    | storage.js| replayQueue, pushToOfflineQueue        |
| LOG write         | app.js    | logJobProgress                        |
| LOG UI            | render.js | unifiedLogEnter, unifiedLogRejectWithDefect |
| onOnline          | storage.js| onOnline                              |
| Asset save        | render.js | closeAssetsOverlay, saveAssetsOverlay; Storage.updateJobAssets |
| Auth profile      | app.js    | authBootstrap, onAuthStateChange, fetchAndStoreProfile |
| Data changed      | app.js    | dismissDataChangedNotice, showDataChangedNotice |
| Audit load        | app.js    | loadAuditPage                         |

---

*End of audit. No patches applied.*
